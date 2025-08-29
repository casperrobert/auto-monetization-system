const Table = require('cli-table3'); const chalk=require('chalk');
const sources=[ 'courses','dropshipping','youtube','apps','affiliate','reits','dividends','p2p' ].map(n=>require('./models/'+n));
(async()=>{
  const params={ targetDaily:500, startCapital:20000, monthlyMarketing:2000 };
  const res=[]; for(const s of sources) res.push(await s.simulate(params));
  const t=new Table({ head:['Quelle','€/Tag','€/Monat','€/Jahr','Risiko','Investition'], colAligns:['left','right','right','right','left','left'] });
  let d=0,m=0,y=0; for(const r of res){ t.push([r.source,r.daily.toFixed(2),r.monthly.toFixed(2),r.yearly.toFixed(2),r.risk,r.invest]); d+=r.daily;m+=r.monthly;y+=r.yearly; }
  console.log(chalk.bold('\n�� Einnahmequellen – Überblick\n')); console.log(t.toString());
  console.log('\n'+chalk.bold('Summen:')); console.log(`➡️  Pro Tag:    ${chalk.green(d.toFixed(2)+' €')}`); console.log(`➡️  Pro Monat:  ${chalk.green(m.toFixed(2)+' €')}`); console.log(`➡️  Pro Jahr:   ${chalk.green(y.toFixed(2)+' €')}\n`);
})();
