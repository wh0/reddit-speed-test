const fs = require('fs');

const express = require('express');
const fetch = require('node-fetch');

const feedP = (async () => {
  try {
  console.log('checking for cached feed');
    const feed = await fs.promises.readFile('/tmp/feed.xml', 'utf-8');
    console.log('found, read');
    return feed;
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    console.log('not found');
  }
  console.log('downloading');
  const res = await fetch('https://www.reddit.com/domain/v.redd.it/.rss');
  const feed = await res.text();
  console.log('done, caching');
  await fs.promises.writeFile('/tmp/feed.xml.tmp', feed, 'utf-8');
  await fs.promises.rename('/tmp/feed.xml.tmp', '/tmp/feed.xml');
  console.log('done');
  return feed;
})();

const app = express();
app.set('trust proxy', true);
app.use((req, res, next) => {
  if (!req.secure && req.hostname !== 'localhost') {
    res.redirect(`https://${req.hostname}${req.url}`);
    return;
  }
  next();
});
app.use(express.static('public'));
app.get('/videos.xml', async (req, res, next) => {
  try {
    const feed = await feedP;
    res.end(feed);
  } catch (e) {
    next(e);
  }
});

app.listen(process.env.PORT);
