const http = require('http');
const fs = require('fs');
var j_buf;
var articles = [];
const j_a = "D://УЧЁБА//5 семестр//Нод.жс//Лабы//node.js_laba_06//artickles.json";
const hostname = '127.0.0.1';
const port = 3000;
var log_file;
var orf;
var sf;
var so;
var reqres_counter = 0;
const handlers = {
  '/sum': sum,
  '/articles/readall': readall,
  '/articles/read': read,
  '/articles/create': acreate,
  '/articles/update': update,
  '/articles/delete': adelete,
  '/comments/create': ccreate,
  '/comments/delete': cdelete,
  '/logs': logs
};

const server = http.createServer((req, res) => 
{
 
  parseBodyJson(req, (err, payload) =>
  {
    if(err)
    {
      console.error(err);
      return;
    }
    const handler = getHandler(req.url);
    handler(req, res, payload, (err, result) => 
    {
      if (err) 
      {
        res.statusCode = err.code;
        res.setHeader('Content-Type', 'application/json');
        res.end( JSON.stringify(err) );
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end( JSON.stringify(result) );
    });
  });
});

server.listen(port, hostname, () => 
{ 
  log_file = fs.openSync(`log.json`, "w+", 0644);
  fs.appendFileSync(log_file, '[');
  j_buf = fs.readFileSync(j_a, 'utf-8');
  articles = JSON.parse(j_buf);
  console.log(`Server running at http://${hostname}:${port}/`);
});


function getHandler(url) 
{
  return handlers[url] || notFound;
}

function sum(req, res, payload, cb) 
{
  const result = { c: payload.a + payload.b };
  fs.appendFileSync(log_file, "Response:");
  fs.appendFileSync(log_file, result);
  cb(null, result);
}

function acreate(req, res, payload, cb)
{
  let isexist = false;
  let result = "id is already exist";
  articles.forEach(element => 
  {
    if(element.id == payload.id)
    {
      isexist = true;
    }
  });
  if(!isexist)
  {
    result = {
                    id: payload.id,
                    title: payload.title,
                    text: payload.text,
                    date: payload.date,
                    author:payload.author,
                    comments: []
                  };
    articles.push(result);
    fs.writeFile(j_a, JSON.stringify(articles), (err) => {if(err)console.error(err)});
  }
  log(req, result);
  cb(null, result);
}

function readall(req, res, payload, cb)
{
  let barr = JSON.parse(JSON.stringify(articles));
  orf = payload.sortOrder == "asc"?true:false;
  sf = payload.sortField?payload.sortField:"date";
  let pg = payload.page=="1"?1:Number.parseInt(payload.page);
  let limit = payload.limit=="10"?10:Number.parseInt(payload.limit);
  let comments = payload.Deps?true:false;
  let meta = {
               'page': pg,
               'pages': Math.floor(articles.length/limit) == articles.length/limit? articles.length/limit: Math.floor(articles.length/limit) + 1,
               'count': articles.length,
               'limit': limit
             }
  if((pg-1)*limit <= barr.length)
  {
    sortArtickles(barr);
    barr.splice(0, pg*limit);
    barr.splice(limit, barr.length);
    if(!comments)
    {
      barr.forEach(element => {
        delete(element.comments);
      });
    }
    let bbarr = [
                  {
                    "items": barr,
                    "meta": meta
                  }
                ]
    let result = bbarr;
    log(req, result);
    cb(null, result);
  }
  else
  {
    let result = "uncorrect page or limit";
    log(req, result);
    cb(null, result);
  }
}

function read(req, res, payload, cb)
{
  var result = "wrong id";
  articles.forEach(element => 
  {
    if(element.id == payload.id)
    {
      result = JSON.stringify(element);
    }
  });
  log(req, result);
  cb(null, result);
}

function adelete(req, res, payload, cb)
{
  let isok = false;
  articles.forEach((element, index) => 
  {
    if(element.id == payload.id)
    {
      articles.splice(index, 1);
      isok = true;
    }
  });
  if(isok)
  {
    let result = `article with id №${payload.id} deleted`;
    log(req, result);
    fs.writeFile(j_a, JSON.stringify(articles), (err) => {if(err)console.error(err)});
    cb(null, result);
  }
  else
  {
    log(req, result);
    let result = "Wrong id";
    cb(null, result);
  }
}

function ccreate(req, res, payload, cb)
{
  var result =  {
                  id: payload.id,
                  articleId: payload.articleId,
                  text: payload.text,
                  date: payload.date,
                  author: payload.author
                }
  let is_ok = false;
  let is_ex = false;
  articles.forEach(item =>
  {
    if(item.id == payload.articleId)
    {
      item.comments.forEach(element => 
      {
        if(element.id == payload.id)
          is_ex = true;
      });
      if(!is_ex)
      {
        item.comments.push(result);
        is_ok = true;
      }
    }
  });
  if(!is_ok)
  {
    result = "error: uncorrect id of artcle or comment"
  }
  log(req, result);
  fs.writeFile(j_a, JSON.stringify(articles), (err) => {if(err)console.error(err)});
  cb(null, result);
}

function cdelete(req, res, payload, cb)
{
  var io = false;
  var result;
  articles.forEach(item => 
  {
    if(item.id = payload.articleId)
    {
      item.comments.forEach((element, index) => 
      {
        if(element.id == payload.id)
        {
          item.comments.splice(index, 1);
          io = true;
        }
      });
    }
  });
  if(io)
  {
    result = "comment was successfully deleted";
  }
  else
  {
    result = "comment isn't exist"
  }
  log(req, result);
  fs.writeFile(j_a, JSON.stringify(articles), (err) => {if(err)console.error(err)});
  cb(null, result);
}

function update(req, res, payload, cb)
{
  let ind = payload.id;
  let is_ex = false;
  let result = `article with id №${ind} isn't exist`
  let obj_ind;
  articles.forEach((element, index) => 
  {
    if(element.id == ind)
    {
      is_ex = true;
      obj_ind = index;
    }    
  });
  if(is_ex)
  {
    articles[obj_ind] = {
                          id: payload.id,
                          title: payload.title,
                          text: payload.text,
                          date: payload.date,
                          author: payload.author,
                          comments: articles[obj_ind].comments
                        }
    result = articles[obj_ind];
    fs.writeFile(j_a, JSON.stringify(articles), (err) => {if(err)console.error(err)});
  }
  log(req, result);
  cb(null, result);
}

function notFound(req, res, payload, cb) 
{
  log(req, result);
  cb({ code: 404, message: 'Not found'});
}

function sortArtickles(arr)
{
  switch(sf)
    {
      case "author":
      {
        arr.sort((a, b)=>
        {
          return orf?a.author.localeCompare(b.author): -a.author.localeCompare(b.author);
        })
        break;
      }
      case "date":
      {
        arr.sort((a, b)=>
        {
          return Date.parse(a.date) >= Date.parse(b.date)? (orf?1:-1):(orf?-1:1);
        })
        break;
      }
      case "id":
      {
        arr.sort((a, b)=>
        {
          return Number.parseInt(a.id) >= Number.parseInt(b.id)? (orf?1:-1):(orf?-1:1);
        })
        break;
      }
      default:
      {
        break;
      }
    }
}

function logs(req, res, payload, cb)
{
  let rbuf = fs.readFileSync("log.json", 'utf-8');
  rbuf = rbuf.substring(0, rbuf.length-1);
  rbuf +=']';
  let result = JSON.parse(rbuf);
  cb(null, result);
}

var endl = `
`;

function log(rq, rs)
{
  fs.appendFileSync(log_file, `{"response": ${reqres_counter++}},`)
  fs.appendFileSync(log_file, JSON.stringify(rs[0]) + endl + ',');
}

function parseBodyJson(req, cb) 
{
  let body = [];
  req.on('data', function(chunk) 
  {
    body.push(chunk);
  }).on('end', function() 
  {
    fs.appendFileSync(log_file, `{"request": ${reqres_counter}},`)
    fs.appendFileSync(log_file, body + endl + ',');
    body = Buffer.concat(body).toString();
    let params = JSON.parse(body);
    cb(null, params);
  });
}