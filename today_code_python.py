import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import time
from flask import Flask, request,jsonify
from xml.etree import ElementTree as ET

def bfsGetAllUrls(target_url):
    que = deque()
    all_urls = []
    queuedUrls = { target_url }
    visitedUrls = set()
    max_url = 1

    que.append(target_url)
    while que and len(all_urls) < max_url:
        curr_url = que.popleft()
        if curr_url in visitedUrls:
            continue

        visitedUrls.add(curr_url)

        if not curr_url.endswith(".xml"):
            
            all_urls.append({
                "base_url": target_url,
                "url": curr_url,
            })

            # all_urls.append(curr_url)
            if len(all_urls) >= max_url:
                break
            continue
        try:
            response = requests.get(curr_url, timeout=10)
            response.raise_for_status()

            if "xml" not in response.headers.get("Content-Type", "").lower():
                all_urls.append(curr_url)
                continue
            tree = ET.fromstring(response.content)
            thisPageUrls = [loc.text for loc in tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]

            for each_url  in thisPageUrls:    
                # print(each_url)
                if each_url  not in queuedUrls:
                    que.append(each_url)
                    queuedUrls.add(each_url)
        except requests.exceptions.RequestException as e:
            print(f"Failed to fetch {curr_url}: {e}")
            continue

    return all_urls


max_crawl = 1

crawl_delay = 2
app = Flask(__name__)
 
@app.route("/crawl")
def crawler():
    crawl_count = 0
    req = request.json
    target_url = req.get("target_url", "").strip()
    print(target_url)

    parsed_url = urlparse(target_url)
    base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"

    sitemapUrl = base_url+"/sitemap.xml"

    all_urls = bfsGetAllUrls(sitemapUrl)
    return all_urls


@app.route("/call-webhook")
def call():
    url = "https://local.codestore.co/n8n/webhook/9aaacdfb-c0d1-4095-baaa-4516989d39d3"
    data = {"key": "value"}

    response = requests.post(url, json=data)
    db_res = response.text
    print(response.status_code, response.text)
    return db_res,200

if __name__=="__main__":
    app.run(host="0.0.0.0",port=5000,debug=True)
