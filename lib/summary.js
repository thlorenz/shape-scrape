'use strict'

const wrap = require('word-wrap')
const fs = require('fs')
const path = require('path')
const sitemap = require('./sitemap')

function reduceSummary(acc, x) {
  const styledAbstract = wrap(x.abstract, { width: 120, indent: '' })
  return acc + `
<h3>${x.title}</h3>

<p>Size: <bold>${x.size}</bold></p>

<h4>Abstract</h4>

<p>${styledAbstract}</p>

<h4>Links</h4>

<ul>
 <li><a href="${x.url}">shape file</a></li>
 <li><a href="${x.metaUrl}">meta data</a></li>
</ul>`
}

function createSummary(dir, x) {
  const html = x.reduce(reduceSummary, '')
  const filename = path.join(dir, 'index.html')
  fs.writeFileSync(filename, html)
}

function categoryDir(x) {
  return path.join(__dirname, '..', 'data', x.category)
}

sitemap
  .map(x => ({ dir: categoryDir(x), content: require(categoryDir(x) + '/content.json') }))
  .forEach(x => createSummary(x.dir, x.content))
