const IAM = {
  token: null,    
  name: null,     
  is_join: false 
};

const MEMBER = {
  0: ""
};

const socket = io();


socket.on("token", (data)=>{

  IAM.token = data.token;


  if( ! IAM.is_join ){
    $("#nowconnecting").style.display = "none"; 
    $("#inputmyname").style.display = "block";   
    $("#txt-myname").focus();
  }
});


$("#frm-myname").addEventListener("submit", (e)=>{

  e.preventDefault();

  const myname = $("#txt-myname");
  if( myname.value === "" ){
    return(false);
  }

  $("#myname").innerHTML = myname.value;
  IAM.name = myname.value;

  socket.emit("join", {token:IAM.token, name:IAM.name});

  $("#frm-myname button").setAttribute("disabled", "disabled");
});


socket.on("join-result", (data)=>{

  if( data.status ){

    IAM.is_join = true;

    for(let i=0; i<data.list.length; i++){
      const cur = data.list[i];
      if( ! (cur.token in MEMBER) ){
        addMemberList(cur.token, cur.name);
      }
    }

    $("#inputmyname").style.display = "none";  
    $("#chat").style.display = "block";         
    $("#msg").focus();
  }

  else{
    alert("入室できませんでした");
  }

  $("#frm-myname button").removeAttribute("disabled");
});


$("#frm-post").addEventListener("submit", (e)=>{

  e.preventDefault();

  const msg = $("#msg");
  if( msg.value === "" ){
    return(false);
  }

  socket.emit("post", {text: msg.value, token:IAM.token});

  msg.value = "";
});


$("#frm-quit").addEventListener("submit", (e)=>{

  e.preventDefault();

  if( confirm("本当に退室しますか？") ){

    socket.emit("quit", {token:IAM.token});

    $("#frm-quit button").setAttribute("disabled", "disabled");
  }
});


socket.on("quit-result", (data)=>{
  if( data.status ){
    gotoSTEP1();
  }
  else{
    alert("退室できませんでした。");
  }


  $("#frm-quit button").removeAttribute("disabled");
});


socket.on("member-join", (data)=>{
  if( IAM.is_join ){
    addMessageFromMaster(`${data.name}さんが入室しました。`);
    addMemberList(data.token, data.name);
  }
});


socket.on("member-quit", (data)=>{
  if( IAM.is_join ){
    const name = MEMBER[data.token];
    addMessageFromMaster(`${name}さんが退室しました。`);
    removeMemberList(data.token);
  }
});


socket.on("member-post", (msg)=>{
  if( IAM.is_join ){
    const is_me = (msg.token === IAM.token);
    addMessage(msg, is_me);
  }
});



function gotoSTEP1(){

  $("#nowconnecting").style.display = "block";  
  $("#inputmyname").style.display = "none";    
  $("#chat").style.display = "none";            


  IAM.token = null;
  IAM.name  = null;
  IAM.is_join = false;


  for( let key in MEMBER ){
    if( key !== "0" ){
      delete MEMBER[key];
    }
  }


  $("#txt-myname").value = "";    
  $("#myname").innerHTML = "";  
  $("#msg").value = "";          
  $("#msglist").innerHTML = "";   
  $("#memberlist").innerHTML = ""; 


  socket.close().open();
}


function addMessage(msg, is_me=false){
  const list = $("#msglist");
  const li = document.createElement("li");
  const name = MEMBER[msg.token];

  if( msg.token === 0 ){
    li.innerHTML = `<span class="msg-master"><span class="name">${name}</span>&gt; ${msg.text}</span>`;
  }

  else if( is_me ){
    li.innerHTML = `<span class="msg-me"><span class="name">${name}</span>&gt; ${msg.text}</span>`;
  }

  else{
    li.innerHTML = `<span class="msg-member"><span class="name">${name}</span>&gt; ${msg.text}</span>`;
  }


  list.insertBefore(li, list.firstChild);
}

function addMessageFromMaster(msg){
  addMessage({token: 0, text: msg});
}



function addMemberList(token, name){
  const list = $("#memberlist");
  const li = document.createElement("li");
  li.setAttribute("id", `member-${token}`);
  if( token == IAM.token ){
    li.innerHTML = `<span class="member-me">${name}</span>`;
  }
  else{
    li.innerHTML = name;
  }

  list.appendChild(li);

  MEMBER[token] = name;
}

function removeMemberList(token){
  const id = `#member-${token}`;
  if( $(id) !== null ){
    $(id).parentNode.removeChild( $(id) );
  }

  delete MEMBER[token];
}
