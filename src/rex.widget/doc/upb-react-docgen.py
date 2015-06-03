#!/usr/bin/env python
import os

fname = 'react-docgen-stdout.txt'
with open(os.path.join(os.path.dirname(__file__), fname), 'r') as f:
    print f.read()
