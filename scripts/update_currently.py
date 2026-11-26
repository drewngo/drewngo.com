"""Refresh the "currently" gist with the latest Letterboxd diary entry.

The "reading" list is left alone, so it can still be edited by hand in the gist.
If Letterboxd fails, the previous value is kept.

Env:
  GIST_TOKEN        GitHub token that can write gists
"""

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

    if new != old:
        write_gist(new)
        print("gist updated")
    else:
        print("no change")

    # fail the run so a broken source shows up in Actions
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
