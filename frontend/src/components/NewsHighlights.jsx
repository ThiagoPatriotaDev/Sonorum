import React,{useEffect,useState} from 'react';
import {EditorialApi} from '../services/editorialApi.js';
export default function NewsHighlights({onNavigate,onArticle}){
 const [news,setNews]=useState([]);
 useEffect(()=>{let mounted=true;EditorialApi.published().then(list=>{if(mounted)setNews(list.slice(0,3))}).catch(()=>{});return()=>{mounted=false}},[]);
 if(!news.length)return null;
 return <section className="home-news-feature"><div className="home-news-heading"><div><span className="section-kicker">SONORUM EM PAUTA</span><h2>As histórias que <em>merecem ser ouvidas.</em></h2></div><button onClick={()=>onNavigate('noticias')}>Todas as notícias ↗</button></div><div className="home-news-grid">{news.map((n,i)=><button key={n.id} onClick={()=>onArticle(n.slug)} className={`home-news-item ${i===0?'featured':''}`}><div className="home-news-image">{n.coverUrl?<img src={n.coverUrl} alt="" loading="lazy"/>:<span>♫</span>}</div><div className="home-news-meta">{n.category} · {new Date(n.publishedAt).toLocaleDateString('pt-BR')}</div><h3>{n.title}</h3><p>{n.excerpt}</p><small>Conhecer a história ↗</small></button>)}</div></section>;
}
