#!/usr/bin/env node
'use strict'
const wrap = require('word-wrap')
const bytes = require('bytes')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const exec = require('child_process').execSync
const dataDir = path.join(__dirname, '..', 'data')

const files = fs.readdirSync(dataDir)

files
  .filter(x => path.extname(x) === '.html')
  .forEach(processHtml)

function getContent(x, contentFile) {
  try {
    return require(contentFile)
  } catch (e) {
    const data = scrapeHtml(path.join(dataDir, x))
    const json = JSON.stringify(data, null, 2)
    fs.writeFileSync(contentFile, json)
    return data
  }
}

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

function processContent(category, dstDir, x) {
  const subdir = x.title
    .replace(/[,\t\n\t]/g, '')
    .replace(/ /g, '.')
  const filename = path.basename(x.url)
  const dir = path.join(dstDir, subdir)
  // allow starting in the middle and/or running multiple instances at the same time
  // the latter could run into a race condition (very slight chance)
  try {
    fs.accessSync(dir)
    return console.error('Skipping %s', x.title)
  } catch (e) {}

  inspect({
      title: x.title
    , url: x.url
    , size: x.size
    , dir
    , filename
  })
  exec(`mkdir -p ${dir}`)
  // that one is 1GB and we already have it
  const styledAbstract = wrap(x.abstract, { width: 120, indent: '' })
  const meta = `# ${x.title}

_${category}_

Size: **${x.size}**

## Abstract

${styledAbstract}

## Links

- [shape file](${x.url})
- [meta data](${x.metaUrl})`

  fs.writeFileSync(path.join(dir, 'README.md'), meta, 'utf8')
  if (!(/FSTopo Transportation Line/).test(x.title)) {
    exec(`wget ${x.url} && unzip ${filename} && rm ${filename}`, { cwd: dir })
  }
}

function processHtml(x) {
  const category = x.slice(0, -5)
  const dstDir = path.join(dataDir, category)
  const contentFile = path.join(dstDir, 'content.json')
  exec(`mkdir -p ${dstDir}`)

  const content = getContent(x, contentFile)
  content.forEach(x => processContent(category, dstDir, x))
}

function scrapeHtml(file) {
  const html = fs.readFileSync(file, 'utf8')
  const $ = cheerio.load(html)
  const rows = $('.fcTable tr')
  const rowsData = []
  rows.map((idx, x) => {
    const tds = $(x).find('td')
    const td0 = $(tds[0])
    const ps = td0.find('p')
    const title = $(ps[0]).text()
    if (!title || !title.trim().length) return
    const p1 = $(ps[1])
    const shapeAnchor = p1.find('a')[1]
    const url = `http://data.fs.usda.gov/geodata/edw/${$(shapeAnchor).attr('href')}`

    const size = p1.find('em')[1]
    const bytesStr = $(size).text()
      .replace(/[()]/g, '')
      .trim()

    const bts = bytes.parse(bytesStr.toLowerCase())

    const td1 = $(tds[1])
    const metadataAnchor = td1.find('a')[0]
    const metaUrl = `http://data.fs.usda.gov/geodata/edw/${$(metadataAnchor).attr('href')}`

    const td2 = $(tds[2])
    const abstract = td2.text()
      .replace(/[\t]+/g, ' ')
      .replace(/[\r\n]+/g, '\n')
      .replace(/. \[see more\] /, '')
      .replace(/ \[see less\]/, '')
      .trim(/[\t\n\r]+/g)
    // ignore maps that are for specific parts only
    if ((/Puerto Rico/i).test(abstract)) return
    if ((/Alaska/i).test(abstract)) return
    rowsData.push({ title, url, metaUrl, abstract, size: bytesStr, bytes: bts })
  })
  return rowsData
}

scrapeHtml('./data/boundaries.html')

