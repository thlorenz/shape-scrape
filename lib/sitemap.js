#!/usr/bin/env node
'use strict'
const path = require('path')
const exec = require('child_process').execSync
const dataDir = path.join(__dirname, '..', 'data')

const sitemap = [
  // there are more categories, see "Downloadable data" here: http://data.fs.usda.gov/geodata/edw/datasets.php
  // but I'm currently only interested in the below
    { category: 'boundaries', url: 'http://data.fs.usda.gov/geodata/edw/datasets.php?dsetCategory=boundaries' }
  , { category: 'imagery+basemaps', url: 'http://data.fs.usda.gov/geodata/edw/datasets.php?dsetCategory=imagerybasemapsearthcover' }
  , { category: 'transportation', url: 'http://data.fs.usda.gov/geodata/edw/datasets.php?dsetCategory=transportation' }
]

sitemap.forEach(download)

function download(x) {
  exec(`curl -L "${x.url}" > ${dataDir}/${x.category}.html`)
}
