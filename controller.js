// Goalkeeper: capture-rate first. Four APCs cover points and stay inside them.
// Scope: the frozen Armor s2.0.0 cup. Terrain analysis runs once in hello;
// a four-neighbour field has at most 128*128 cells per objective.
const FP = 65536, FULL = 4096;
let rules, map, goals, assigned, side;
const distance = (x,y,a,b) => Math.hypot(a-x,b-y);
const angle = (x,y,a,b) => Math.round(Math.atan2(b-y,a-x)*FULL/(2*Math.PI)) & 4095;
const delta = (a,b) => {const d=(b-a)&4095;return d>2048?d-4096:d;};
const open = (x,y) => x>=0 && y>=0 && x<map.width && y<map.height && rules.terrainSpeed[map.terrain[y*map.width+x]]>0;
function field(goal) {
  const w=map.width, h=map.height, a=new Int32Array(w*h); a.fill(-1);
  const q=new Int32Array(w*h); let head=0, tail=0;
  // Finish anywhere in the inner half of the capture radius, including near cover.
  for(let y=Math.max(0,Math.floor((goal.y-goal.radius)/FP));y<Math.min(h,Math.ceil((goal.y+goal.radius)/FP));y++)
    for(let x=Math.max(0,Math.floor((goal.x-goal.radius)/FP));x<Math.min(w,Math.ceil((goal.x+goal.radius)/FP));x++)
      if(open(x,y)&&distance((x+.5)*FP,(y+.5)*FP,goal.x,goal.y)<goal.radius*.55) {const i=y*w+x;a[i]=0;q[tail++]=i;}
  while(head<tail) {
    const i=q[head++], x=i%w,y=Math.floor(i/w);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,n=ny*w+nx;
      if(open(nx,ny)&&a[n]<0){a[n]=a[i]+1;q[tail++]=n;}
    }
  }
  return a;
}
globalThis.controller = {
  draft(h) {
    const pick=['apc','apc','apc','apc'];
    return pick.length>=h.draft.min && pick.length<=h.draft.max && h.draft.roster.includes('apc') && 4*h.draft.costs.apc<=h.draft.budget ? pick : undefined;
  },
  hello(h) {
    rules=h.rules;map=h.map;side=h.side;goals=h.objectives.map(g=>({...g,field:field(g)}));assigned={};
    const allocated=goals.map(()=>0);
    for(const u of h.units) {
      let gi=0,best=-1;
      for(let i=0;i<goals.length;i++) {
        const g=goals[i],tile=Math.floor(u.y/FP)*map.width+Math.floor(u.x/FP),cost=g.field[tile];
        const score=cost<0?-1:g.weight/((10+cost)*(1+allocated[i]*2));
        if(score>best){best=score;gi=i;}
      }
      if(goals.length){assigned[u.id]=gi;allocated[gi]++;}
    }
  },
  tick(o) {
    const orders=[];
    for(const u of o.units) {
      if(!u.alive)continue;
      const spec=rules.units[u.kind],order={id:u.id};
      if(o.canMove)order.throttle=0;
      const goal=goals[assigned[u.id]??0];
      if(o.canMove&&goal&&distance(u.x,u.y,goal.x,goal.y)>goal.radius*.68) {
        const tx=Math.floor(u.x/FP),ty=Math.floor(u.y/FP),current=goal.field[ty*map.width+tx];
        let gx=goal.x,gy=goal.y,best=current<0?Infinity:current;
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const x=tx+dx,y=ty+dy,d=goal.field[y*map.width+x];
          if(open(x,y)&&d>=0&&d<best){best=d;gx=(x+.5)*FP;gy=(y+.5)*FP;}
        }
        let want=angle(u.x,u.y,gx,gy);
        if(u.blocked){want=(u.heading+683)&4095;order.throttle=-FP/2;}
        else order.throttle=Math.abs(delta(u.heading,want))>512?Math.round(FP/5):FP;
        order.steer=Math.max(-FP,Math.min(FP,Math.round(delta(u.heading,want)*FP/spec.turnRate)));
      }
      let target=null,nearest=Infinity;
      for(const c of o.contacts) {
        const d=distance(u.x,u.y,c.x,c.y);
        if(d<nearest){nearest=d;target=c;}
      }
      if(target&&spec.gun.mode==='direct') {
        order.aimAt=[target.x,target.y];
        if(u.reload===0&&nearest<=spec.gun.maxRange&&Math.abs(delta(u.turret,angle(u.x,u.y,target.x,target.y)))<=spec.gun.aimTolerance)order.fire=true;
      }
      orders.push(order);
    }
    return {units:orders};
  }
};
