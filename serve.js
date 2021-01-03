const crypto = require("crypto");
const app  = require("express")();
const http = require("http").createServer(app);
const io   = require("socket.io")(http);


const DOCUMENT_ROOT = __dirname + "/public";
const SECRET_TOKEN = "abcdefghijklmn12345";
const MEMBER = {};

let MEMBER_COUNT = 1;


app.get("/", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/index.html");
});


app.get("/:file", (req, res)=>{
  res.sendFile(DOCUMENT_ROOT + "/" + req.params.file);
});


io.on("connection", (socket)=>{

  (()=>{
    const token = makeToken(socket.id);

    MEMBER[socket.id] = {token: token, name:null, count:MEMBER_COUNT};
    MEMBER_COUNT++;

    io.to(socket.id).emit("token", {token:token});
  })();


  socket.on("join", (data)=>{

    if (authToken(socket.id, data.token)) {
      
      const memberlist = getMemberList();
      io.to(socket.id).emit("join-result", {status: true, list: memberlist});

      MEMBER[socket.id].name = data.name;

      io.to(socket.id).emit("member-join", data);
      socket.broadcast.emit("member-join", {name:data.name, token:MEMBER[socket.id].count});
    }

    else{
 
      io.to(socket.id).emit("join-result", {status: false});
    }
  });

  socket.on("post", (data)=>{

    if (authToken(socket.id, data.token)) {
      
      io.to(socket.id).emit("member-post", data);

      socket.broadcast.emit("member-post", {text:data.text, token:MEMBER[socket.id].count});
    }

  });



  socket.on("quit", (data)=>{

    if (authToken(socket.id, data.token)) {
      
      io.to(socket.id).emit("quit-result", {status: true});

      socket.broadcast.emit("member-quit", {token:MEMBER[socket.id].count});

      delete MEMBER[socket.id];
    }

    else{
  
      io.to(socket.id).emit("quit-result", {status: false});
    }
  });

});

http.listen(3000, ()=>{
  console.log("listening on *:3000");
});




function makeToken(id){
  const str = SECRET_TOKEN + id;
  return( crypto.createHash("sha1").update(str).digest('hex') );
}

function authToken(socketid, token){
  return(
    (socketid in MEMBER) && (token === MEMBER[socketid].token)
  );
}

function getMemberList(){
  const list = [];
  for( let key in MEMBER ){
    const cur = MEMBER[key];
    if( cur.name !== null ){
      list.push({token:cur.count, name:cur.name});
    }
  }
  return(list);
}
