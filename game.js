(function(){
"use strict";

// ===== CANVAS =====
var C = document.getElementById('gameCanvas');
var X = C.getContext('2d');
C.width = window.innerWidth;
C.height = window.innerHeight;

var MC = document.getElementById('minimap');
var MX = MC.getContext('2d');
var SC = document.getElementById('speedo-canvas');
var SX = SC.getContext('2d');
var CC = document.getElementById('compass-canvas');
var CX = CC.getContext('2d');

// ===== STATE =====
var state = 'menu';
var money = 1000;
var selCar = 0;
var owned = [0];
var done = [];
var mStart = 0;
var mActive = false;
var curMission = null;
var dmg = 0;
var maxDmg = 100;
var parkAcc = 0;
var camMode = 0;
var frameCount = 0;

// Load
try {
    var s1=localStorage.getItem('pm3_m'); if(s1) money=parseInt(s1);
    var s2=localStorage.getItem('pm3_c'); if(s2) selCar=parseInt(s2);
    var s3=localStorage.getItem('pm3_o'); if(s3) owned=JSON.parse(s3);
    var s4=localStorage.getItem('pm3_d'); if(s4) done=JSON.parse(s4);
} catch(e){}

function save(){
    try{
        localStorage.setItem('pm3_m',money);
        localStorage.setItem('pm3_c',selCar);
        localStorage.setItem('pm3_o',JSON.stringify(owned));
        localStorage.setItem('pm3_d',JSON.stringify(done));
    }catch(e){}
}

// ===== CARS =====
var CARS=[
    {id:0,nm:'تعليم',em:'🚗',pr:0,col:'#4FC3F7',col2:'#039BE5',spd:3,hnd:8,sz:1,w:30,h:55,ac:.08,mx:3,ts:.035,fr:.97},
    {id:1,nm:'سيدان',em:'🚙',pr:2000,col:'#66BB6A',col2:'#43A047',spd:5,hnd:7,sz:2,w:32,h:60,ac:.1,mx:4,ts:.032,fr:.97},
    {id:2,nm:'رياضية',em:'🏎️',pr:5000,col:'#EF5350',col2:'#D32F2F',spd:9,hnd:6,sz:1,w:28,h:52,ac:.15,mx:6,ts:.028,fr:.98},
    {id:3,nm:'SUV',em:'🚕',pr:4000,col:'#FFA726',col2:'#F57C00',spd:4,hnd:5,sz:3,w:36,h:65,ac:.07,mx:3.5,ts:.025,fr:.96},
    {id:4,nm:'شاحنة',em:'🛻',pr:6000,col:'#8D6E63',col2:'#5D4037',spd:3,hnd:4,sz:4,w:38,h:75,ac:.06,mx:3,ts:.022,fr:.95},
    {id:5,nm:'فاخرة',em:'🚘',pr:8000,col:'#283593',col2:'#1A237E',spd:7,hnd:7,sz:2,w:33,h:62,ac:.12,mx:5,ts:.03,fr:.97},
    {id:6,nm:'كلاسيك',em:'🚗',pr:10000,col:'#880E4F',col2:'#4A148C',spd:4,hnd:6,sz:2,w:34,h:63,ac:.09,mx:3.5,ts:.03,fr:.96},
    {id:7,nm:'سوبر',em:'🏎️',pr:15000,col:'#FF6F00',col2:'#E65100',spd:10,hnd:5,sz:1,w:30,h:55,ac:.18,mx:8,ts:.026,fr:.98},
    {id:8,nm:'ليموزين',em:'🚐',pr:20000,col:'#212121',col2:'#000000',spd:3,hnd:3,sz:5,w:34,h:90,ac:.05,mx:2.5,ts:.018,fr:.95},
    {id:9,nm:'باص',em:'🚌',pr:25000,col:'#F9A825',col2:'#F57F17',spd:2,hnd:2,sz:5,w:40,h:95,ac:.04,mx:2,ts:.015,fr:.94}
];

var MISS=[
    {id:1,nm:'ركن سهل',ds:'موقف واسع',ic:'1',df:1,rw:200,pw:55,ph:80,ob:2,tl:60},
    {id:2,nm:'السوبرماركت',ds:'بين سيارتين',ic:'2',df:1,rw:300,pw:50,ph:75,ob:4,tl:60},
    {id:3,nm:'شارع ضيق',ds:'مساحة محدودة',ic:'3',df:2,rw:400,pw:45,ph:70,ob:5,tl:50},
    {id:4,nm:'ركن موازي',ds:'ركن جانبي',ic:'4',df:2,rw:500,pw:75,ph:48,ob:6,tl:55},
    {id:5,nm:'المول',ds:'مزدحم',ic:'5',df:3,rw:600,pw:44,ph:68,ob:8,tl:50},
    {id:6,nm:'المدينة',ds:'حركة كثيفة',ic:'6',df:3,rw:700,pw:42,ph:65,ob:10,tl:45},
    {id:7,nm:'المستشفى',ds:'دقة وسرعة',ic:'7',df:4,rw:800,pw:40,ph:62,ob:8,tl:40},
    {id:8,nm:'المطار',ds:'موقف ضيق',ic:'8',df:4,rw:1000,pw:40,ph:60,ob:12,tl:45},
    {id:9,nm:'حي قديم',ds:'شوارع ملتوية',ic:'9',df:5,rw:1200,pw:38,ph:60,ob:14,tl:40},
    {id:10,nm:'الماستر',ds:'الاصعب',ic:'T',df:5,rw:2000,pw:36,ph:58,ob:16,tl:35}
];

// ===== GAME OBJECTS =====
var P={x:0,y:0,a:0,s:0,w:30,h:55,ac:.08,mx:3,ts:.035,fr:.97,col:'#4FC3F7',col2:'#039BE5'};
var inp={g:false,b:false,r:false,l:false,ri:false,hb:false};
var pk={x:0,y:0,w:50,h:75,a:0};
var obs=[];
var W=1500,H=1500;
var cm={x:0,y:0,sx:0,sy:0};

// Lighting & effects
var timeOfDay = 0; // 0-1, affects lighting
var shadows = [];
var tireTracks = [];
var particles = [];

// ===== GENERATE =====
function genLevel(m){
    var c=CARS[selCar];
    P={x:200,y:H-200,a:-Math.PI/2,s:0,w:c.w,h:c.h,ac:c.ac,mx:c.mx,ts:c.ts,fr:c.fr,col:c.col,col2:c.col2};
    pk={x:W/2+(Math.random()-.5)*400,y:H/2+(Math.random()-.5)*400,w:m.pw,h:m.ph,a:Math.floor(Math.random()*4)*Math.PI/2};
    obs=[];
    tireTracks=[];
    particles=[];
    timeOfDay = 0.3 + Math.random() * 0.4;

    var oc=['#37474F','#455A64','#546E7A','#607D8B','#78909C','#263238','#B71C1C','#1B5E20','#0D47A1','#4A148C'];
    for(var i=0;i<m.ob;i++){
        var ox,oy,t=0;
        do{ox=100+Math.random()*(W-200);oy=100+Math.random()*(H-200);t++}
        while(t<30&&((Math.abs(ox-pk.x)<100&&Math.abs(oy-pk.y)<100)||(Math.abs(ox-P.x)<120&&Math.abs(oy-P.y)<120)));
        obs.push({x:ox,y:oy,w:28+Math.random()*12,h:50+Math.random()*20,a:Math.random()*Math.PI*2,
            col:oc[Math.floor(Math.random()*oc.length)],
            col2:oc[Math.floor(Math.random()*oc.length)],
            tp:Math.random()>.15?'car':'bar'});
    }
    var wt=30;
    obs.push({x:W/2,y:wt/2,w:W,h:wt,a:0,col:'#333',col2:'#222',tp:'w'});
    obs.push({x:W/2,y:H-wt/2,w:W,h:wt,a:0,col:'#333',col2:'#222',tp:'w'});
    obs.push({x:wt/2,y:H/2,w:wt,h:H,a:0,col:'#333',col2:'#222',tp:'w'});
    obs.push({x:W-wt/2,y:H/2,w:wt,h:H,a:0,col:'#333',col2:'#222',tp:'w'});

    dmg=0;mStart=Date.now();mActive=true;
}

// ===== COLLISION =====
function corners(cx,cy,w,h,a){
    var hw=w/2,hh=h/2,co=Math.cos(a),si=Math.sin(a);
    return[{x:cx+(-hw*co-(-hh)*si),y:cy+(-hw*si+(-hh)*co)},
           {x:cx+(hw*co-(-hh)*si),y:cy+(hw*si+(-hh)*co)},
           {x:cx+(hw*co-hh*si),y:cy+(hw*si+hh*co)},
           {x:cx+(-hw*co-hh*si),y:cy+(-hw*si+hh*co)}];
}

function sat(a,b){
    var ps=[a,b];
    for(var p=0;p<2;p++){
        var pg=ps[p];
        for(var i=0;i<pg.length;i++){
            var j=(i+1)%pg.length;
            var ax=-(pg[j].y-pg[i].y),ay=pg[j].x-pg[i].x;
            var na=1e9,xa=-1e9,nb=1e9,xb=-1e9;
            for(var k=0;k<a.length;k++){var pr=a[k].x*ax+a[k].y*ay;if(pr<na)na=pr;if(pr>xa)xa=pr;}
            for(var k=0;k<b.length;k++){var pr=b[k].x*ax+b[k].y*ay;if(pr<nb)nb=pr;if(pr>xb)xb=pr;}
            if(xa<nb||xb<na)return false;
        }
    }
    return true;
}

// ===== PARTICLES =====
function addParticles(x,y,col,n,spd,life){
    for(var i=0;i<n;i++){
        var a=Math.random()*Math.PI*2,sp=Math.random()*spd;
        particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
            l:life||20+Math.random()*20,ml:life||20+Math.random()*20,
            col:col,sz:1+Math.random()*3,g:.05});
    }
}

// ===== UPDATE =====
function update(){
    if(!mActive)return;
    frameCount++;

    // Car physics
    if(inp.g)P.s+=P.ac;
    if(inp.b){P.s-=P.ac*(P.s>0?2:.5);}
    if(inp.r)P.s-=P.ac*.7;
    if(inp.hb)P.s*=.9;
    P.s=Math.max(-P.mx*.5,Math.min(P.mx,P.s));
    if(!inp.g&&!inp.b&&!inp.r)P.s*=P.fr;
    if(Math.abs(P.s)<.01)P.s=0;

    if(Math.abs(P.s)>.1){
        var sf=P.ts*(P.s>0?1:-1)*Math.max(.3,1-Math.abs(P.s)/(P.mx*2));
        if(inp.l)P.a-=sf;
        if(inp.ri)P.a+=sf;
    }

    var dx=Math.sin(P.a)*P.s,dy=-Math.cos(P.a)*P.s;
    var nx=P.x+dx,ny=P.y+dy;

    // Tire tracks
    if(Math.abs(P.s)>.5&&frameCount%3===0){
        var bx=P.x-Math.sin(P.a)*P.h*.35;
        var by=P.y+Math.cos(P.a)*P.h*.35;
        tireTracks.push({x:bx,y:by,l:200});
    }

    // Brake particles
    if(inp.b&&Math.abs(P.s)>1&&frameCount%2===0){
        var bx=P.x-Math.sin(P.a)*P.h*.4;
        var by=P.y+Math.cos(P.a)*P.h*.4;
        addParticles(bx,by,'rgba(200,200,200,0.3)',1,1,15);
    }

    // Exhaust
    if(inp.g&&frameCount%4===0){
        var ex=P.x-Math.sin(P.a)*P.h*.45;
        var ey=P.y+Math.cos(P.a)*P.h*.45;
        addParticles(ex,ey,'rgba(100,100,100,0.2)',1,.8,20);
    }

    var hit=false;
    var cc=corners(nx,ny,P.w,P.h,P.a);
    for(var i=0;i<obs.length;i++){
        var o=obs[i];
        if(sat(cc,corners(o.x,o.y,o.w,o.h,o.a))){
            hit=true;
            var force=Math.abs(P.s)*5;
            dmg+=force;
            P.s*=-.3;
            cm.sx=(Math.random()-.5)*force*2;
            cm.sy=(Math.random()-.5)*force*2;
            addParticles(nx,ny,'#FF6D00',5,3,15);
            break;
        }
    }
    if(!hit){P.x=nx;P.y=ny;}

    if(dmg>=maxDmg) fail('تم تدمير السيارة');

    // Parking check
    var pdx=P.x-pk.x,pdy=P.y-pk.y;
    var dist=Math.sqrt(pdx*pdx+pdy*pdy);
    updateDist(dist);

    if(dist<15&&Math.abs(P.s)<.1){
        var ad=Math.abs(normA(P.a-pk.a));
        if(ad<.3||Math.abs(ad-Math.PI)<.3){
            var pa=Math.max(0,100-dist*5);
            var aa=Math.max(0,100-Math.min(ad,Math.abs(ad-Math.PI))*100);
            parkAcc=(pa+aa)/2;
            if(parkAcc>50)complete();
        }
    }

    // Timer
    if(mActive&&curMission){
        var el=(Date.now()-mStart)/1000;
        var rem=curMission.tl-el;
        if(rem<=0)fail('انتهى الوقت');
        updTimer(rem);
    }

    // Particles
    for(var i=particles.length-1;i>=0;i--){
        var p=particles[i];
        p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.97;p.l--;
        if(p.l<=0)particles.splice(i,1);
    }

    // Tire tracks fade
    for(var i=tireTracks.length-1;i>=0;i--){
        tireTracks[i].l--;
        if(tireTracks[i].l<=0)tireTracks.splice(i,1);
    }
}

function normA(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}

// ===== CAMERA =====
function updCam(){
    var tx,ty;
    if(camMode===0){tx=P.x+Math.sin(P.a)*100-C.width/2;ty=P.y-Math.cos(P.a)*100-C.height/2;}
    else if(camMode===1){tx=P.x-C.width/2;ty=P.y-C.height/2;}
    else{tx=P.x-Math.sin(P.a)*80-C.width/2;ty=P.y+Math.cos(P.a)*80-C.height/2;}
    cm.x+=(tx-cm.x)*.1;cm.y+=(ty-cm.y)*.1;
    if(cm.sx){cm.x+=cm.sx;cm.sx*=.8;if(Math.abs(cm.sx)<.1)cm.sx=0;}
    if(cm.sy){cm.y+=cm.sy;cm.sy*=.8;if(Math.abs(cm.sy)<.1)cm.sy=0;}
}

// ===== DRAW =====
function rr(x,y,w,h,r){
    X.beginPath();
    X.moveTo(x+r,y);X.lineTo(x+w-r,y);X.arcTo(x+w,y,x+w,y+r,r);
    X.lineTo(x+w,y+h-r);X.arcTo(x+w,y+h,x+w-r,y+h,r);
    X.lineTo(x+r,y+h);X.arcTo(x,y+h,x,y+h-r,r);
    X.lineTo(x,y+r);X.arcTo(x,y,x+r,y,r);X.closePath();
}

function draw(){
    X.clearRect(0,0,C.width,C.height);

    // Sky gradient based on time
    var skyTop,skyBot;
    if(timeOfDay<.3){skyTop='#0a0e27';skyBot='#1a1a3e';}
    else if(timeOfDay<.6){skyTop='#87CEEB';skyBot='#E0F7FA';}
    else{skyTop='#FF6F00';skyBot='#FFF9C4';}

    var sg=X.createLinearGradient(0,0,0,C.height*.3);
    sg.addColorStop(0,skyTop);sg.addColorStop(1,skyBot);
    X.fillStyle=sg;X.fillRect(0,0,C.width,C.height*.3);

    // Ground color
    var ambient=.4+timeOfDay*.6;
    var gBase=Math.floor(58*ambient);
    X.fillStyle='rgb('+gBase+','+gBase+','+gBase+')';
    X.fillRect(0,C.height*.3,C.width,C.height*.7);

    X.save();
    X.translate(-cm.x,-cm.y);

    // Asphalt with texture
    var ag=X.createRadialGradient(W/2,H/2,100,W/2,H/2,W);
    ag.addColorStop(0,'rgba(60,60,60,'+ambient+')');
    ag.addColorStop(1,'rgba(40,40,40,'+ambient+')');
    X.fillStyle=ag;
    X.fillRect(0,0,W,H);

    // Road texture dots
    X.fillStyle='rgba(0,0,0,.08)';
    for(var tx=0;tx<W;tx+=30){
        for(var ty=0;ty<H;ty+=30){
            if((tx*7+ty*13)%100<20){
                X.fillRect(tx,ty,2,1);
            }
        }
    }

    // Grid lines (subtle)
    X.strokeStyle='rgba(255,255,255,.04)';X.lineWidth=1;
    for(var gx=0;gx<W;gx+=100){X.beginPath();X.moveTo(gx,0);X.lineTo(gx,H);X.stroke();}
    for(var gy=0;gy<H;gy+=100){X.beginPath();X.moveTo(0,gy);X.lineTo(W,gy);X.stroke();}

    // Lane markings
    X.strokeStyle='rgba(255,255,255,.08)';X.lineWidth=2;X.setLineDash([15,12]);
    for(var lx=200;lx<W;lx+=200){X.beginPath();X.moveTo(lx,0);X.lineTo(lx,H);X.stroke();}
    for(var ly=200;ly<H;ly+=200){X.beginPath();X.moveTo(0,ly);X.lineTo(W,ly);X.stroke();}
    X.setLineDash([]);

    // Tire tracks
    X.fillStyle='rgba(0,0,0,.15)';
    for(var i=0;i<tireTracks.length;i++){
        var t=tireTracks[i];
        var al=t.l/200;
        X.globalAlpha=al*.3;
        X.fillRect(t.x-1,t.y-1,3,3);
    }
    X.globalAlpha=1;

    // Parking spot with glow effect
    drawParking();

    // Shadows first (under cars)
    for(var i=0;i<obs.length;i++)drawShadow(obs[i]);
    drawShadow(P);

    // Obstacles
    for(var i=0;i<obs.length;i++)drawObs(obs[i]);

    // Player car
    drawCar();

    // Particles
    for(var i=0;i<particles.length;i++){
        var p=particles[i];
        var al=p.l/p.ml;
        X.globalAlpha=al;
        X.fillStyle=p.col;
        X.beginPath();X.arc(p.x-cm.x+cm.x,p.y-cm.y+cm.y,p.sz*al,0,Math.PI*2);X.fill();
    }
    X.globalAlpha=1;

    // Arrow
    drawArrow();

    X.restore();

    // Vignette
    var vg=X.createRadialGradient(C.width/2,C.height/2,C.width*.3,C.width/2,C.height/2,C.width*.7);
    vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.35)');
    X.fillStyle=vg;X.fillRect(0,0,C.width,C.height);

    // Lens flare (if time is sunset-ish)
    if(timeOfDay>.5&&timeOfDay<.8){
        var fx=C.width*.7,fy=C.height*.15;
        var lg=X.createRadialGradient(fx,fy,0,fx,fy,100);
        lg.addColorStop(0,'rgba(255,200,50,.15)');
        lg.addColorStop(.5,'rgba(255,150,0,.05)');
        lg.addColorStop(1,'rgba(255,100,0,0)');
        X.fillStyle=lg;X.beginPath();X.arc(fx,fy,100,0,Math.PI*2);X.fill();
    }
}

function drawShadow(o){
    X.save();
    X.translate(o.x+5,o.y+5);
    X.rotate(o.a);
    X.fillStyle='rgba(0,0,0,.25)';
    rr(-o.w/2,-o.h/2,o.w,o.h,5);
    X.fill();
    X.restore();
}

function drawParking(){
    var p=pk;
    var dist=Math.sqrt((P.x-p.x)*(P.x-p.x)+(P.y-p.y)*(P.y-p.y));
    var cl=dist<100;
    var pu=Math.sin(Date.now()*.005)*.3+.7;

    X.save();X.translate(p.x,p.y);X.rotate(p.a);

    // Glow
    if(cl){
        var gl=X.createRadialGradient(0,0,0,0,0,Math.max(p.w,p.h));
        gl.addColorStop(0,'rgba(0,230,118,'+(0.1*pu)+')');
        gl.addColorStop(1,'rgba(0,230,118,0)');
        X.fillStyle=gl;X.fillRect(-p.w,-p.h,p.w*2,p.h*2);
    }

    // Fill
    X.fillStyle=cl?'rgba(0,230,118,'+(0.12*pu)+')':'rgba(79,195,247,'+(0.08*pu)+')';
    X.fillRect(-p.w/2,-p.h/2,p.w,p.h);

    // Border
    X.strokeStyle=cl?'rgba(0,230,118,'+(0.8*pu)+')':'rgba(79,195,247,'+(0.5*pu)+')';
    X.lineWidth=3;X.setLineDash([8,4]);
    X.strokeRect(-p.w/2,-p.h/2,p.w,p.h);
    X.setLineDash([]);

    // Corner dots
    var cn=[[-p.w/2,-p.h/2],[p.w/2,-p.h/2],[-p.w/2,p.h/2],[p.w/2,p.h/2]];
    X.fillStyle=cl?'#00E676':'#4FC3F7';
    for(var i=0;i<cn.length;i++){X.beginPath();X.arc(cn[i][0],cn[i][1],4,0,Math.PI*2);X.fill();}

    // P
    X.fillStyle='rgba(255,255,255,'+(0.3*pu)+')';
    X.font='bold 20px Arial';X.textAlign='center';X.textBaseline='middle';
    X.fillText('P',0,0);

    X.restore();
}

function drawObs(o){
    X.save();X.translate(o.x,o.y);X.rotate(o.a);

    if(o.tp==='car'){
        // Body
        X.fillStyle=o.col;rr(-o.w/2,-o.h/2,o.w,o.h,5);X.fill();

        // Roof highlight
        X.fillStyle='rgba(255,255,255,.08)';
        X.fillRect(-o.w/2+5,-o.h/2+14,o.w-10,o.h-32);

        // Windshield
        var wg=X.createLinearGradient(0,-o.h/2+6,0,-o.h/2+18);
        wg.addColorStop(0,'rgba(100,200,255,.5)');wg.addColorStop(1,'rgba(50,150,200,.2)');
        X.fillStyle=wg;X.fillRect(-o.w/2+3,-o.h/2+6,o.w-6,12);

        // Rear window
        X.fillStyle='rgba(100,200,255,.25)';
        X.fillRect(-o.w/2+4,o.h/2-16,o.w-8,10);

        // Headlights
        X.fillStyle='rgba(255,255,200,.5)';
        X.beginPath();X.arc(-o.w/2+5,-o.h/2+3,2.5,0,Math.PI*2);
        X.arc(o.w/2-5,-o.h/2+3,2.5,0,Math.PI*2);X.fill();

        // Taillights
        X.fillStyle='rgba(255,40,40,.5)';
        X.beginPath();X.arc(-o.w/2+5,o.h/2-3,2,0,Math.PI*2);
        X.arc(o.w/2-5,o.h/2-3,2,0,Math.PI*2);X.fill();

        // Side stripe
        X.fillStyle=o.col2;
        X.fillRect(-o.w/2,o.h/2*.1,o.w,3);

        // Door line
        X.strokeStyle='rgba(0,0,0,.15)';X.lineWidth=1;
        X.beginPath();X.moveTo(0,-o.h/2+15);X.lineTo(0,o.h/2-15);X.stroke();

    }else if(o.tp==='bar'){
        X.fillStyle='#FF6D00';X.fillRect(-o.w/2,-o.h/2,o.w,o.h);
        X.fillStyle='#FFF';
        for(var s=-o.h/2;s<o.h/2;s+=12)X.fillRect(-o.w/2,s,o.w,5);
    }else{
        // Wall with texture
        X.fillStyle='#444';X.fillRect(-o.w/2,-o.h/2,o.w,o.h);
        X.fillStyle='#555';
        for(var bx=-o.w/2;bx<o.w/2;bx+=20){
            X.fillRect(bx,-o.h/2,19,o.h);
        }
    }
    X.restore();
}

function drawCar(){
    X.save();X.translate(P.x,P.y);X.rotate(P.a);

    // Body
    X.fillStyle=P.col;rr(-P.w/2,-P.h/2,P.w,P.h,7);X.fill();

    // Bottom body darker
    X.fillStyle=P.col2;
    X.fillRect(-P.w/2,P.h*.1,P.w,P.h*.4-P.h*.1);

    // Roof shine
    var rg=X.createLinearGradient(-P.w/2,-P.h/2+14,P.w/2,-P.h/2+14);
    rg.addColorStop(0,'rgba(255,255,255,.05)');
    rg.addColorStop(.5,'rgba(255,255,255,.15)');
    rg.addColorStop(1,'rgba(255,255,255,.05)');
    X.fillStyle=rg;
    X.fillRect(-P.w/2+4,-P.h/2+13,P.w-8,P.h-30);

    // Windshield with reflection
    var wg=X.createLinearGradient(0,-P.h/2+4,0,-P.h/2+18);
    wg.addColorStop(0,'rgba(120,220,255,.6)');
    wg.addColorStop(.5,'rgba(200,240,255,.3)');
    wg.addColorStop(1,'rgba(80,180,220,.4)');
    X.fillStyle=wg;
    rr(-P.w/2+3,-P.h/2+4,P.w-6,14,3);X.fill();

    // Rear window
    X.fillStyle='rgba(100,200,255,.35)';
    rr(-P.w/2+4,P.h/2-17,P.w-8,11,2);X.fill();

    // Side windows
    X.fillStyle='rgba(100,200,255,.2)';
    X.fillRect(-P.w/2+1,-P.h/2+18,3,P.h-36);
    X.fillRect(P.w/2-4,-P.h/2+18,3,P.h-36);

    // Headlights with glow
    X.fillStyle='#FFFFF0';
    X.shadowColor='#FFFFF0';
    X.shadowBlur=P.s>.5?12:4;
    X.beginPath();
    X.arc(-P.w/2+5,-P.h/2+3,3.5,0,Math.PI*2);
    X.arc(P.w/2-5,-P.h/2+3,3.5,0,Math.PI*2);
    X.fill();
    X.shadowBlur=0;

    // DRL strip
    X.fillStyle='rgba(255,255,255,.4)';
    X.fillRect(-P.w/2+3,-P.h/2+1,P.w-6,1.5);

    // Light beam
    if(P.s>.3){
        X.fillStyle='rgba(255,255,220,.03)';
        X.beginPath();
        X.moveTo(-P.w/2+2,-P.h/2);
        X.lineTo(-P.w/2-20,-P.h/2-90);
        X.lineTo(P.w/2+20,-P.h/2-90);
        X.lineTo(P.w/2-2,-P.h/2);
        X.fill();
    }

    // Taillights
    X.fillStyle=inp.b?'#FF0000':'rgba(255,30,30,.4)';
    X.shadowColor='#FF0000';X.shadowBlur=inp.b?8:0;
    X.beginPath();
    X.arc(-P.w/2+5,P.h/2-3,3,0,Math.PI*2);
    X.arc(P.w/2-5,P.h/2-3,3,0,Math.PI*2);
    X.fill();
    X.shadowBlur=0;

    // Tail light strip
    X.fillStyle=inp.b?'rgba(255,0,0,.3)':'rgba(255,30,30,.15)';
    X.fillRect(-P.w/2+3,P.h/2-1,P.w-6,1.5);

    // Reverse lights
    if(inp.r||P.s<-.1){
        X.fillStyle='rgba(255,255,255,.6)';
        X.beginPath();
        X.arc(-P.w/2+10,P.h/2-3,2,0,Math.PI*2);
        X.arc(P.w/2-10,P.h/2-3,2,0,Math.PI*2);
        X.fill();
    }

    // Side mirrors
    X.fillStyle=P.col;
    X.fillRect(-P.w/2-4,-P.h/2+16,4,5);
    X.fillRect(P.w/2,-P.h/2+16,4,5);
    X.fillStyle='rgba(100,200,255,.3)';
    X.fillRect(-P.w/2-3,-P.h/2+17,2,3);
    X.fillRect(P.w/2+1,-P.h/2+17,2,3);

    // Door handles
    X.fillStyle='rgba(255,255,255,.2)';
    X.fillRect(-P.w/2+1,-P.h/2+P.h*.35,2,4);
    X.fillRect(P.w/2-3,-P.h/2+P.h*.35,2,4);

    // Door line
    X.strokeStyle='rgba(0,0,0,.12)';X.lineWidth=.5;
    X.beginPath();X.moveTo(0,-P.h/2+14);X.lineTo(0,P.h/2-14);X.stroke();

    // Wheels with steering
    var wa=0;
    if(inp.l)wa=-.35;if(inp.ri)wa=.35;

    X.fillStyle='#111';
    X.save();X.translate(-P.w/2+2,-P.h/2+11);X.rotate(wa);
    X.fillRect(-3,-4,5,8);
    X.fillStyle='#333';X.fillRect(-2,-3,3,6);
    X.restore();
    X.save();X.translate(P.w/2-2,-P.h/2+11);X.rotate(wa);
    X.fillRect(-2,-4,5,8);
    X.fillStyle='#333';X.fillRect(-1,-3,3,6);
    X.restore();

    X.fillStyle='#111';
    X.fillRect(-P.w/2,P.h/2-15,5,9);
    X.fillRect(P.w/2-5,P.h/2-15,5,9);
    X.fillStyle='#333';
    X.fillRect(-P.w/2+1,P.h/2-14,3,7);
    X.fillRect(P.w/2-4,P.h/2-14,3,7);

    X.restore();
}

function drawArrow(){
    var dx=pk.x-P.x,dy=pk.y-P.y;
    var d=Math.sqrt(dx*dx+dy*dy);
    if(d>120){
        var a=Math.atan2(dy,dx),r=70;
        var ax=P.x+Math.cos(a)*r,ay=P.y+Math.sin(a)*r;
        var pu=Math.sin(Date.now()*.005)*.3+.7;
        X.save();X.translate(ax,ay);X.rotate(a+Math.PI/2);
        X.fillStyle='rgba(79,195,247,'+(0.5*pu)+')';
        X.beginPath();X.moveTo(0,-10);X.lineTo(8,4);X.lineTo(-8,4);X.closePath();X.fill();
        X.restore();
    }
}

// ===== MINIMAP =====
function drawMinimap(){
    MX.clearRect(0,0,120,120);
    MX.fillStyle='rgba(20,30,40,.8)';MX.fillRect(0,0,120,120);
    var s=120/W;
    MX.fillStyle='rgba(60,60,60,.5)';MX.fillRect(0,0,W*s,H*s);

    for(var i=0;i<obs.length;i++){
        var o=obs[i];
        if(o.tp==='w')continue;
        MX.fillStyle=o.tp==='car'?'rgba(150,150,150,.6)':'rgba(255,109,0,.5)';
        MX.fillRect(o.x*s-1,o.y*s-1,3,3);
    }

    // Parking
    var pu=Math.sin(Date.now()*.005)*.5+.5;
    MX.fillStyle='rgba(79,195,247,'+(.5+pu*.3)+')';
    MX.fillRect(pk.x*s-3,pk.y*s-3,6,6);

    // Player
    MX.fillStyle='#00E676';
    MX.save();MX.translate(P.x*s,P.y*s);MX.rotate(P.a);
    MX.fillRect(-2,-3,4,6);
    MX.restore();

    // Border
    MX.strokeStyle='rgba(255,255,255,.15)';MX.lineWidth=1;
    MX.strokeRect(0,0,120,120);
}

// ===== SPEEDOMETER =====
function drawSpeedo(){
    SX.clearRect(0,0,120,120);
    var cx=60,cy=60,r=50;

    // BG
    SX.beginPath();SX.arc(cx,cy,r,0,Math.PI*2);
    SX.fillStyle='rgba(0,0,0,.7)';SX.fill();
    SX.strokeStyle='rgba(79,195,247,.4)';SX.lineWidth=2;SX.stroke();

    // Speed arc
    var kmh=Math.abs(Math.floor(P.s*20));
    var maxKmh=P.mx*20;
    var pct=kmh/maxKmh;

    var startA=Math.PI*.75;
    var endA=Math.PI*2.25;
    var curA=startA+pct*(endA-startA);

    SX.beginPath();SX.arc(cx,cy,r-6,startA,endA);
    SX.strokeStyle='rgba(255,255,255,.1)';SX.lineWidth=4;SX.stroke();

    SX.beginPath();SX.arc(cx,cy,r-6,startA,curA);
    var sc=pct>.7?'#FF5252':pct>.4?'#FFD740':'#4FC3F7';
    SX.strokeStyle=sc;SX.lineWidth=4;SX.stroke();

    // Number
    SX.fillStyle=sc;SX.font='bold 22px Arial';SX.textAlign='center';SX.textBaseline='middle';
    SX.fillText(kmh,cx,cy-4);
    SX.fillStyle='#6a7a8a';SX.font='8px Arial';
    SX.fillText('km/h',cx,cy+12);

    // Gear
    var gear='N';
    if(P.s>.1)gear='D';else if(P.s<-.1)gear='R';else if(inp.hb)gear='P';
    document.getElementById('gear-box').textContent=gear;
}

// ===== COMPASS =====
function drawCompass(){
    CX.clearRect(0,0,100,30);
    CX.fillStyle='rgba(0,0,0,.5)';
    CX.fillRect(0,0,100,30);

    var dirs=['N','NE','E','SE','S','SW','W','NW'];
    var deg=(-P.a*180/Math.PI+360)%360;

    CX.font='bold 10px Arial';CX.textAlign='center';CX.textBaseline='middle';

    for(var i=0;i<dirs.length;i++){
        var da=i*45;
        var diff=((da-deg+180+360)%360)-180;
        var sx=50+diff*0.8;
        if(sx<0||sx>100)continue;
        CX.fillStyle=dirs[i]==='N'?'#FF5252':(Math.abs(diff)<20?'#fff':'#6a7a8a');
        CX.fillText(dirs[i],sx,15);
    }

    CX.strokeStyle='rgba(255,255,255,.15)';CX.lineWidth=1;
    CX.strokeRect(0,0,100,30);

    // Center marker
    CX.fillStyle='#4FC3F7';
    CX.beginPath();CX.moveTo(50,26);CX.lineTo(47,30);CX.lineTo(53,30);CX.closePath();CX.fill();
}

// ===== UI =====
function updMoney(){
    document.getElementById('money-val').textContent='$'+money;
    var g=document.getElementById('gar-money');if(g)g.textContent='$'+money;
}

function updTimer(r){
    if(r<0)r=0;
    var m=Math.floor(r/60).toString(),s=Math.floor(r%60).toString();
    if(m.length<2)m='0'+m;if(s.length<2)s='0'+s;
    document.getElementById('timer-val').textContent=m+':'+s;
    document.getElementById('timer-box').style.borderColor=r<10?'#FF5252':'rgba(255,255,255,.08)';
}

function updDmg(){
    var pct=Math.max(0,(maxDmg-dmg)/maxDmg*100);
    var b=document.getElementById('damage-fill');
    b.style.width=pct+'%';
    b.style.background=pct>60?'linear-gradient(90deg,#00E676,#8BC34A)':pct>30?'linear-gradient(90deg,#FFD740,#FFA000)':'linear-gradient(90deg,#FF5252,#D32F2F)';
    document.getElementById('damage-text').textContent=Math.floor(pct)+'%';
}

function updateDist(d){
    document.getElementById('dist-val').textContent=Math.floor(d)+'m';
    var a=Math.atan2(pk.y-P.y,pk.x-P.x)-P.a;
    document.getElementById('dist-arrow').style.transform='rotate('+a+'rad)';
    document.getElementById('dist-val').style.color=d<30?'#00E676':'#4FC3F7';
}

// ===== MISSION FLOW =====
function startM(m){
    curMission=m;genLevel(m);state='play';
    hideAll();
    document.getElementById('hint-box').classList.remove('hidden');
    document.getElementById('dist-box').classList.remove('hidden');
    document.getElementById('hint-text').textContent=m.ds;
    document.getElementById('mission-val').textContent=m.nm;
    updMoney();
}

function complete(){
    if(!mActive)return;mActive=false;
    var el=(Date.now()-mStart)/1000;
    var tb=Math.max(0,curMission.tl-el);
    var db=Math.max(0,100-dmg);
    var st=1;
    if(parkAcc>70&&db>50)st=2;
    if(parkAcc>85&&db>80&&tb>curMission.tl*.3)st=3;
    var rw=Math.floor(curMission.rw*(1+tb/curMission.tl)*(db/100)*(st/2));
    rw=Math.max(50,rw);
    money+=rw;
    if(done.indexOf(curMission.id)===-1)done.push(curMission.id);
    save();

    var ss='';for(var i=0;i<3;i++)ss+=i<st?'★ ':'☆ ';
    document.getElementById('res-stars').textContent=ss;
    document.getElementById('res-title').textContent=st===3?'ممتاز!':st===2?'احسنت!':'جيد';
    document.getElementById('res-info').innerHTML='الوقت: '+Math.floor(el)+' ث<br>الدقة: '+Math.floor(parkAcc)+'%<br>السيارة: '+Math.floor(db)+'%';
    document.getElementById('res-reward').textContent='+$'+rw;
    document.getElementById('result-screen').classList.remove('hidden');
    state='result';
}

function fail(r){
    if(!mActive)return;mActive=false;
    document.getElementById('fail-screen').classList.remove('hidden');
    document.getElementById('fail-why').textContent=r;
    state='fail';
}

function hideAll(){
    ['menu-screen','garage-screen','missions-screen','result-screen','fail-screen'].forEach(function(id){
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('dist-box').classList.add('hidden');
}

// ===== GARAGE =====
function showGarage(){
    hideAll();document.getElementById('garage-screen').classList.remove('hidden');
    state='garage';updMoney();renderCars();
}

function renderCars(){
    var g=document.getElementById('cars-list'),h='';
    for(var i=0;i<CARS.length;i++){
        var c=CARS[i],ow=owned.indexOf(c.id)!==-1,sl=selCar===c.id,cb=money>=c.pr;
        var cls='car-c'+(ow?' own':'')+(sl?' sel':'')+(!ow&&!cb?' lck':'');
        h+='<div class="'+cls+'">';
        h+='<span class="car-em">'+c.em+'</span>';
        h+='<div class="car-nm">'+c.nm+'</div>';
        h+='<div class="car-sts">';
        h+='<div class="car-st">سرعة<div class="car-bar"><div class="car-bf" style="width:'+(c.spd*10)+'%;background:#4FC3F7"></div></div></div>';
        h+='<div class="car-st">تحكم<div class="car-bar"><div class="car-bf" style="width:'+(c.hnd*10)+'%;background:#00E676"></div></div></div>';
        h+='</div>';
        if(ow){
            h+=sl?'<button class="car-bt b3" disabled>مختارة</button>':'<button class="car-bt b2" data-sel="'+c.id+'">اختيار</button>';
        }else{
            h+='<div class="car-pr">'+(c.pr>0?'$'+c.pr:'مجاني')+'</div>';
            h+='<button class="car-bt b1" data-buy="'+c.id+'"'+(cb?'':' disabled')+'>'+(cb?'شراء':'مقفل')+'</button>';
        }
        h+='</div>';
    }
    g.innerHTML=h;

    var bbs=g.querySelectorAll('[data-buy]');
    for(var i=0;i<bbs.length;i++)bbs[i].addEventListener('click',function(){
        var id=parseInt(this.getAttribute('data-buy'));
        var c=null;for(var j=0;j<CARS.length;j++)if(CARS[j].id===id)c=CARS[j];
        if(!c||money<c.pr||owned.indexOf(id)!==-1)return;
        money-=c.pr;owned.push(id);selCar=id;save();updMoney();renderCars();
    });

    var sbs=g.querySelectorAll('[data-sel]');
    for(var i=0;i<sbs.length;i++)sbs[i].addEventListener('click',function(){
        var id=parseInt(this.getAttribute('data-sel'));
        if(owned.indexOf(id)===-1)return;
        selCar=id;save();renderCars();
    });
}

// ===== MISSIONS =====
function showMissions(){
    hideAll();document.getElementById('missions-screen').classList.remove('hidden');
    state='missions';
    var l=document.getElementById('miss-list'),h='';
    for(var i=0;i<MISS.length;i++){
        var m=MISS[i],dn=done.indexOf(m.id)!==-1;
        var df='';for(var d=0;d<m.df;d++)df+='★';
        h+='<div class="ms-c'+(dn?' done':'')+'" data-mi="'+i+'">';
        h+='<span class="ms-ic">'+m.ic+'</span>';
        h+='<div class="ms-nf"><div class="ms-nm">'+m.nm+(dn?' ✓':'')+'</div>';
        h+='<div class="ms-ds">'+m.ds+'</div>';
        h+='<div class="ms-mt"><span class="ms-rw">$'+m.rw+'+</span>';
        h+='<span class="ms-df">'+df+'</span></div></div></div>';
    }
    l.innerHTML=h;
    var cs=l.querySelectorAll('.ms-c');
    for(var i=0;i<cs.length;i++)cs[i].addEventListener('click',function(){
        startM(MISS[parseInt(this.getAttribute('data-mi'))]);
    });
}

// ===== INPUT =====
function addT(id,k){
    var e=document.getElementById(id);if(!e)return;
    e.addEventListener('touchstart',function(ev){ev.preventDefault();inp[k]=true;this.classList.add('pressed');},{passive:false});
    e.addEventListener('touchend',function(){inp[k]=false;this.classList.remove('pressed');});
    e.addEventListener('touchcancel',function(){inp[k]=false;this.classList.remove('pressed');});
    e.addEventListener('mousedown',function(ev){ev.preventDefault();inp[k]=true;this.classList.add('pressed');});
    e.addEventListener('mouseup',function(){inp[k]=false;this.classList.remove('pressed');});
    e.addEventListener('mouseleave',function(){inp[k]=false;this.classList.remove('pressed');});
}
addT('btn-gas','g');addT('btn-brake','b');addT('btn-reverse','r');
addT('btn-left','l');addT('btn-right','ri');addT('btn-park','hb');

document.getElementById('btn-cam').addEventListener('click',function(){camMode=(camMode+1)%3;});

document.addEventListener('keydown',function(e){
    if(e.code==='ArrowUp'||e.code==='KeyW')inp.g=true;
    if(e.code==='ArrowDown'||e.code==='KeyS')inp.b=true;
    if(e.code==='ArrowLeft'||e.code==='KeyA')inp.l=true;
    if(e.code==='ArrowRight'||e.code==='KeyD')inp.ri=true;
    if(e.code==='KeyR')inp.r=true;
    if(e.code==='Space')inp.hb=true;
    if(e.code==='KeyC')camMode=(camMode+1)%3;
});
document.addEventListener('keyup',function(e){
    if(e.code==='ArrowUp'||e.code==='KeyW')inp.g=false;
    if(e.code==='ArrowDown'||e.code==='KeyS')inp.b=false;
    if(e.code==='ArrowLeft'||e.code==='KeyA')inp.l=false;
    if(e.code==='ArrowRight'||e.code==='KeyD')inp.ri=false;
    if(e.code==='KeyR')inp.r=false;
    if(e.code==='Space')inp.hb=false;
});

// ===== BUTTONS =====
document.getElementById('btn-play').addEventListener('click',function(){showMissions();});
document.getElementById('btn-garage').addEventListener('click',function(){showGarage();});
document.getElementById('btn-gar-back').addEventListener('click',function(){hideAll();document.getElementById('menu-screen').classList.remove('hidden');state='menu';});
document.getElementById('btn-miss-back').addEventListener('click',function(){hideAll();document.getElementById('menu-screen').classList.remove('hidden');state='menu';});
document.getElementById('btn-res-next').addEventListener('click',function(){hideAll();showMissions();});
document.getElementById('btn-res-menu').addEventListener('click',function(){hideAll();document.getElementById('menu-screen').classList.remove('hidden');state='menu';});
document.getElementById('btn-fail-retry').addEventListener('click',function(){hideAll();if(curMission)startM(curMission);});
document.getElementById('btn-fail-menu').addEventListener('click',function(){hideAll();document.getElementById('menu-screen').classList.remove('hidden');state='menu';});

window.addEventListener('resize',function(){C.width=window.innerWidth;C.height=window.innerHeight;});

// ===== LOOP =====
function loop(){
    if(state==='play'){
        update();updCam();draw();updDmg();
        drawMinimap();drawSpeedo();drawCompass();
    }
    requestAnimationFrame(loop);
}

updMoney();
loop();

})();