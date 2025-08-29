let _state = {
  running:false, startedAt:null, lastTick:null, lastRebalance:null,
  equity:100000, cash:100000, pnlDay:0, pnlTotal:0, positions:[]
};
const snapshot = ()=>_state;
const start=(opts={})=>{ if(_state.running) return {ok:true,state:_state};
  _state.running=true; _state.startedAt=new Date().toISOString();
  _state.lastRebalance=_state.startedAt; return {ok:true,state:_state}; };
const stop =()=>({ok:true,state:(_state.running=false,_state)});
const rebalance =()=>({ok:true,state:(_state.lastRebalance=new Date().toISOString(),_state)});
module.exports = { engine: { snapshot, start, stop, rebalance } };
