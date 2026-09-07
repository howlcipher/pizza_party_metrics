#!/usr/bin/env python3
"""Automated SEO verification script for Pizza Party Metrics.

Validates:
- HTML title and meta description presence and length limits
- Canonical URL
- Exactly one H1 tag
- Open Graph and Twitter Card tags
- JSON-LD WebApplication schema attributing William Elias
- robots.txt and sitemap.xml files in public/ and root
"""

import html
import json
import os
import re
import sys
import xml.etree.ElementTree as ET


def test_seo():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_html_path = os.path.join(repo_root, "index.html")
    robots_path = os.path.join(repo_root, "public", "robots.txt")
    sitemap_path = os.path.join(repo_root, "public", "sitemap.xml")

    print("=== Running Pizza Party Metrics SEO Verification ===")

    # 1. Check index.html exists
    if not os.path.isfile(index_html_path):
        print(f"  [FAIL] Missing index.html at {index_html_path}")
        sys.exit(1)

    with open(index_html_path, encoding="utf-8") as f:
        content = f.read()

    # 2. Check title
    title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
    if not title_match:
        print("  [FAIL] Missing <title> tag")
        sys.exit(1)
    title = title_match.group(1).strip()
    print(f"  [PASS] HTML <title> exists: {html.unescape(title)}")

    # 3. Check meta description
    desc_regex_1 = r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']'
    desc_regex_2 = r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']'
    desc_match = re.search(desc_regex_1, content, re.IGNORECASE) or re.search(
        desc_regex_2, content, re.IGNORECASE
    )
    if not desc_match:
        print("  [FAIL] Missing meta description")
        sys.exit(1)
    desc = desc_match.group(1).strip()
    if len(desc) > 165:
        print(f"  [FAIL] Meta description too long ({len(desc)} > 165 chars): {desc}")
        sys.exit(1)
    print(f"  [PASS] meta description exists: {desc[:60]}... ({len(desc)} chars)")

    # 4. Check canonical link
    canon_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.*?)["\']', content, re.IGNORECASE)
    if not canon_match:
        print("  [FAIL] Missing canonical URL link tag")
        sys.exit(1)
    canon_url = canon_match.group(1).strip()
    expected_canon = "https://howlcipher.github.io/pizza_party_metrics/"
    if canon_url != expected_canon:
        print(f"  [FAIL] Canonical URL mismatch: expected {expected_canon}, got {canon_url}")
        sys.exit(1)
    print(f"  [PASS] Canonical URL matches: {canon_url}")

    # 5. Check exactly 1 H1
    h1_matches = re.findall(r"<h1\b[^>]*>(.*?)</h1>", content, re.IGNORECASE | re.DOTALL)
    if len(h1_matches) != 1:
        print(f"  [FAIL] Expected exactly 1 H1 tag in index.html, found {len(h1_matches)}")
        sys.exit(1)
    h1_text = re.sub(r"<[^>]+>", "", h1_matches[0]).strip()
    print(f"  [PASS] Exactly 1 H1 present in index.html: {h1_text}")

    # 6. Check Open Graph & Twitter Cards
    og_title = re.search(r'<meta\s+property=["\']og:title["\']', content, re.IGNORECASE)
    og_desc = re.search(r'<meta\s+property=["\']og:description["\']', content, re.IGNORECASE)
    tw_card = re.search(r'<meta\s+name=["\']twitter:card["\']', content, re.IGNORECASE)
    if not (og_title and og_desc and tw_card):
        print("  [FAIL] Incomplete Open Graph / Twitter Card tags")
        sys.exit(1)
    print("  [PASS] Open Graph and Twitter card tags verified")

    # 7. Check JSON-LD
    json_ld_match = re.search(r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>', content, re.IGNORECASE | re.DOTALL)
    if not json_ld_match:
        print("  [FAIL] Missing JSON-LD script block")
        sys.exit(1)
    try:
        data = json.loads(json_ld_match.group(1).strip())
        if data.get("@type") not in ("WebApplication", "SoftwareApplication"):
            print(f"  [FAIL] JSON-LD @type is {data.get('@type')}")
            sys.exit(1)
        author = data.get("author", {})
        if author.get("name") != "William Elias":
            print(f"  [FAIL] Author name is {author.get('name')}, expected William Elias")
            sys.exit(1)
        print("  [PASS] JSON-LD valid and correctly attributes William Elias")
    except Exception as e:
        print(f"  [FAIL] Invalid JSON-LD: {e}")
        sys.exit(1)

    # 8. Check internal links
    if "https://howlcipher.github.io/william_elias/" not in content:
        print("  [FAIL] Missing link to William Elias portfolio hub")
        sys.exit(1)
    print("  [PASS] Internal entity link to William Elias verified")

    # 9. Check robots.txt
    if not os.path.isfile(robots_path):
        print(f"  [FAIL] Missing robots.txt at {robots_path}")
        sys.exit(1)
    with open(robots_path, encoding="utf-8") as f:
        robots_content = f.read()
    if "Sitemap:" not in robots_content or "https://howlcipher.github.io/pizza_party_metrics/sitemap.xml" not in robots_content:
        print("  [FAIL] robots.txt does not properly reference sitemap.xml")
        sys.exit(1)
    print("  [PASS] public/robots.txt valid and references sitemap")

    # 10. Check sitemap.xml
    if not os.path.isfile(sitemap_path):
        print(f"  [FAIL] Missing sitemap.xml at {sitemap_path}")
        sys.exit(1)
    try:
        tree = ET.parse(sitemap_path)
        root = tree.getroot()
        urls = [elem.text for elem in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        if expected_canon not in urls:
            print(f"  [FAIL] sitemap.xml does not contain {expected_canon}")
            sys.exit(1)
        print("  [PASS] public/sitemap.xml valid and contains canonical URL")
    except Exception as e:
        print(f"  [FAIL] Malformed sitemap.xml: {e}")
        sys.exit(1)

    print("\nAll Pizza Party Metrics SEO validations PASSED successfully!")


if __name__ == "__main__":
    test_seo()
