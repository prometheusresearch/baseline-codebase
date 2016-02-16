
import re


RE_EXTERNAL = re.compile(r'^(?:http|https):')
def is_external(url):
    return RE_EXTERNAL.match(url)
