"""Refresh the "currently" gist with the latest Letterboxd diary entry and
the books on the Goodreads currently-reading shelf.

"Last read": Goodreads doesn't show the read shelf to logged-out visitors,
but the profile does show each shelf's count. When a book drops off
currently-reading and the read count goes up, that book is kept as the
last read (status "finished"). The last count is stored in the gist.

If a source fails, its previous value is kept.

Env:
  GIST_TOKEN        GitHub token that can write gists
"""

import html
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

GIST_ID = "86e6049381f2a0b9dcfb0e731ec97c48"
GIST_FILE = "currently.json"
LETTERBOXD_USER = "drewskeez"
LB_NS = {"letterboxd": "https://letterboxd.com"}
# Goodreads no longer serves shelf RSS to logged-out readers, so the
# "currently reading" box on the public profile page is scraped instead.
GOODREADS_PROFILE = "https://www.goodreads.com/user/show/206721071-andrew-ngo"


def http(url, method="GET", data=None, headers=None):
    req = urllib.request.Request(url, method=method, data=data, headers=headers or {})
    req.add_header("User-Agent", "currently-updater")
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def gh_headers():
    return {
        "Authorization": "Bearer " + os.environ["GIST_TOKEN"],
        "Accept": "application/vnd.github+json",
    }


def read_gist():
    gist = json.loads(http("https://api.github.com/gists/" + GIST_ID, headers=gh_headers()))
    return json.loads(gist["files"][GIST_FILE]["content"])


def write_gist(data):
    body = json.dumps({"files": {GIST_FILE: {"content": json.dumps(data, indent=2, ensure_ascii=False) + "\n"}}})
    http("https://api.github.com/gists/" + GIST_ID, method="PATCH", data=body.encode(), headers=gh_headers())


def stars(rating):
    if not rating:
        return ""
    r = float(rating)
    return "★" * int(r) + ("½" if r % 1 else "")


def latest_film(user):
    root = ET.fromstring(http(f"https://letterboxd.com/{user}/rss/"))
    for item in root.iter("item"):
        title = item.findtext("letterboxd:filmTitle", namespaces=LB_NS)
        if not title:  # skip list posts etc.
            continue
        poster = re.search(r'<img src="([^"]+)"', item.findtext("description") or "")
        # diary links look like /<user>/film/<slug>/[n/]; point at the film page instead
        slug = re.search(r"/film/([^/]+)/", item.findtext("link") or "")
        link = f"https://letterboxd.com/film/{slug.group(1)}/" if slug else ""
        return {
            "title": title,
            "creator": item.findtext("letterboxd:filmYear", "", LB_NS),
            "link": link,
            "cover": poster.group(1) if poster else "",
            "status": "finished",
            "progress": stars(item.findtext("letterboxd:memberRating", namespaces=LB_NS)),
            "note": "",
        }
    return None


def goodreads_profile(url):
    """Return (books on currently-reading, number of books on the read shelf)."""
    page = http(url).decode("utf-8", "replace")
    count = re.search(r'\?shelf=read">\s*read&lrm;\s*\((\d+)\)', page)
    if not count:
        raise ValueError("read shelf count not found; profile layout changed?")
    return current_books(page), int(count.group(1))


def current_books(page):
    if 'id="currentlyReadingReviews"' not in page:
        return []  # nothing on the shelf
    box = page.split('id="currentlyReadingReviews"', 1)[1].split('class=" clearFloats bigBox"', 1)[0]
    books = []
    for entry in box.split('class="Updates')[1:]:
        t = re.search(r'class="bookTitle" href="([^"]+)">([^<]+)</a>', entry)
        if not t:
            continue
        a = re.search(r'class="authorName" href="[^"]+">([^<]+)</a>', entry)
        img = re.search(r'<img [^>]*src="([^"]+)"', entry)
        title = re.sub(r"\s*\([^()]*#[\d.]+\)$", "", html.unescape(t.group(2)).strip())  # drop "(Dune, #1)"
        books.append({
            "title": title,
            "author": html.unescape(a.group(1)).strip() if a else "",
            "link": "https://www.goodreads.com" + t.group(1).split("?")[0],
            "cover": re.sub(r"\._S[XY]\d+_", "", img.group(1)) if img else "",  # full-size cover
            "status": "reading",
            "progress": "",
            "note": "",
        })
    if not books:
        raise ValueError("currently-reading box found but no books parsed")
    return books


def keep_note(new, old_items):
    """Keep a hand-written note if the item hasn't changed."""
    for old in old_items or []:
        if old.get("title") == new["title"] and old.get("note"):
            new["note"] = old["note"]
    return [new]


def main():
    old = read_gist()
    new = dict(old)
    new.pop("listening", None)  # no longer shown on the site
    failed = False

    try:
        film = latest_film(LETTERBOXD_USER)
        if film:
            new["watching"] = keep_note(film, old.get("watching"))
    except Exception as e:
        print("letterboxd failed:", e, file=sys.stderr)
        failed = True

    try:
        books, read_count = goodreads_profile(GOODREADS_PROFILE)
        old_reading = old.get("reading") or []
        old_current = [b for b in old_reading if b.get("status") != "finished"]
        last_read = [b for b in old_reading if b.get("status") == "finished"][:1]
        # finished = dropped off currently-reading while the read shelf grew
        now_titles = {b["title"] for b in books}
        dropped = [b for b in old_current if b.get("title") not in now_titles]
        prev_count = old.get("goodreads_read_count")
        if dropped and prev_count is not None and read_count > prev_count:
            last_read = [{**dropped[0], "status": "finished"}]
        # a book already in the gist keeps its hand-edited fields (author, cover, note)
        prev = {b.get("title"): b for b in old_current}
        new["reading"] = [prev.get(b["title"], b) for b in books] + last_read
        new["goodreads_read_count"] = read_count
    except Exception as e:
        print("goodreads failed:", e, file=sys.stderr)
        failed = True

    if new != old:
        write_gist(new)
        print("gist updated")
    else:
        print("no change")

    # fail the run so a broken source shows up in Actions
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
