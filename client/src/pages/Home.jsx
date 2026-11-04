import { useEffect, useState } from 'react';
import api from '../services/api';
import assetUrl, { staticAssetFallback } from '../utils/assetUrl';

const sections = ['about','skills','projects','experience','education','certificates'];
const externalUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};
export default function Home(){
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{Promise.all([api.get('/profile'),...sections.map(s=>api.get('/'+s))]).then(([p,...rest])=>setData({profile:p.data,sections:Object.fromEntries(sections.map((s,i)=>[s,rest[i].data]))})).catch(err=>setError(`Unable to load portfolio: ${err.response?.data?.message||`Cannot reach the API at ${api.defaults.baseURL}. Start the server and confirm its database connection.`}`))},[]);
  if(error)return <main className="wrap"><p role="alert">{error}</p></main>;
  if(!data)return <main className="wrap"><p>Loading portfolio…</p></main>;
  const p=data.profile,items=data.sections,title=s=>s[0].toUpperCase()+s.slice(1);
  return <>
    <header className="nav"><a href="#top">{p?.name||'Portfolio'}</a><nav>{['about','skills','projects','experience','education','certificates','contact'].map(s=><a key={s} href={'#'+s}>{title(s)}</a>)}<a href="/admin/login">Admin</a></nav></header>
    <main id="top">
      <section className="hero wrap">{p?.photo&&<img className="avatar" src={assetUrl(p.photo)} onError={e=>{const fallback=staticAssetFallback(p.photo);if(fallback){e.currentTarget.onerror=null;e.currentTarget.src=fallback}}} alt={p.name||'Profile'}/>}<p className="eyebrow">{p?.title||''}</p><h1>{p?.name||'Nothing added yet'}</h1><p>{p?.intro||''}</p>{p?.resume&&<a className="button" href={assetUrl(p.resume)} target="_blank" rel="noreferrer">Download resume</a>}<p>{(p?.socialLinks||[]).map(x=>{const href=externalUrl(x.url);return href?<a className="social" key={x.label} href={href} target="_blank" rel="noreferrer">{x.label}</a>:null})}</p></section>
      <section id="about" className="wrap"><h2>About me</h2><p>{items.about?.content||'Nothing added yet'}</p></section>
      {sections.slice(1).map(s=><section id={s} className="wrap" key={s}><h2>{title(s)}</h2>{Array.isArray(items[s])&&items[s].length?<div className="grid">{items[s].map(x=>{const image=x.image||x.photo;return <article className="card" key={x._id}>{image&&<img src={assetUrl(image)} onError={e=>{const fallback=staticAssetFallback(image);if(fallback){e.currentTarget.onerror=null;e.currentTarget.src=fallback}}} alt=""/>}<h3>{x.title||x.name||x.category}</h3><p className="preline">{s==='skills'?x.category:(x.description||x.institution||x.organization||'')}</p>{s==='skills'&&<p>{x.level}</p>}{x.techStack?.length>0&&<p>{x.techStack.join(' · ')}</p>}<div className="links">{externalUrl(x.github)&&<a href={externalUrl(x.github)} target="_blank" rel="noreferrer">GitHub</a>}{externalUrl(x.live)&&<a href={externalUrl(x.live)} target="_blank" rel="noreferrer">Live</a>}{externalUrl(x.url)&&<a href={externalUrl(x.url)} target="_blank" rel="noreferrer">Certificate</a>}</div></article>})}</div>:<p className="muted">Nothing added yet</p>}</section>)}
      <section id="contact" className="wrap"><h2>Contact</h2><p>{p?.email||''} {p?.location||''}</p><Contact/></section>
    </main><footer className="wrap">© {new Date().getFullYear()} {p?.name||''}</footer>
  </>;
}

function Contact(){const[status,setStatus]=useState('');async function submit(e){e.preventDefault();const form=e.currentTarget;try{await api.post('/messages',Object.fromEntries(new FormData(form)));setStatus('Message sent.');form.reset()}catch(err){setStatus(err.response?.data?.message||'Unable to send message.')}}return <form className="form" onSubmit={submit}><input name="name" placeholder="Your name" required maxLength="100"/><input name="email" type="email" placeholder="Your email" required maxLength="200"/><textarea name="content" placeholder="Your message" required maxLength="5000"/><button>Send message</button><p>{status}</p></form>}
