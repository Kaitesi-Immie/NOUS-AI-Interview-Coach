import { useState, useEffect, useRef } from "react";
import {
  Brain, ArrowRight, Eye, EyeOff, User, Lock, Mail,
  BarChart2, Zap, Layout, MessageSquare,
  CheckCircle, TrendingUp, Clock, Hash, DollarSign,
  RotateCcw, Download, Send, Lightbulb, SkipForward,
  RefreshCw, X, Key, Circle, Star, Shield, Target,
  LogOut,
} from "lucide-react";

// ── CHANGE THIS after Railway deploys ─────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── GLOBAL STYLES ───────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500;600&family=Jost+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --lav:      #C8CCE0;
  --lav-d:    #9AA0BF;
  --lav-x:    #7880A8;
  --slate:    #3D3F5C;
  --slate-m:  #5C5F80;
  --slate-l:  #8386A8;
  --cream:    #F5F3EE;
  --cream-d:  #EAE7E0;
  --cream-x:  #DDD9CF;
  --gold:     #B8A96A;
  --gold-l:   #D4C88A;
  --gold-p:   #F2EDD8;
  --white:    #FFFFFF;
  --ok:       #4A7C5F;
  --ok-bg:    rgba(74,124,95,0.1);
  --warn-bg:  #FBF6EC;
  --warn-txt: #7A5C20;
  --r:        5px;
  --r-lg:     16px;
  --r-xl:     24px;
}

html { scroll-behavior: smooth; }
body {
  font-family: 'Jost', sans-serif;
  background: var(--cream);
  color: var(--slate);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

@keyframes fadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes scaleIn  { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
@keyframes slideR   { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
@keyframes blink    { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes shimmer  { from{background-position:200% center} to{background-position:-200% center} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes tdot     { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
@keyframes orb1     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
@keyframes orb2     { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.05)} }
@keyframes pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(184,169,106,.4)} 70%{box-shadow:0 0 0 10px rgba(184,169,106,0)} }

.anim-fade-up  { animation: fadeUp  .6s ease both; }
.anim-fade-in  { animation: fadeIn  .4s ease both; }
.anim-scale-in { animation: scaleIn .3s ease both; }
.anim-slide-r  { animation: slideR  .5s ease both; }

.d1{animation-delay:.1s!important} .d2{animation-delay:.2s!important}
.d3{animation-delay:.3s!important} .d4{animation-delay:.4s!important}
.d5{animation-delay:.5s!important} .d6{animation-delay:.6s!important}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--lav);border-radius:2px}

/* NAV */
.land-nav{position:fixed;top:0;left:0;right:0;z-index:50;padding:0 60px;height:68px;display:flex;align-items:center;justify-content:space-between;background:rgba(245,243,238,.88);backdrop-filter:blur(14px);border-bottom:1px solid rgba(200,204,224,.4);transition:box-shadow .3s}
.nav-brand{display:flex;align-items:center;gap:10px}
.nav-logo{width:36px;height:36px;border-radius:10px;background:var(--slate);display:flex;align-items:center;justify-content:center;color:var(--gold)}
.nav-name{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--slate);letter-spacing:.3px}
.nav-name span{color:var(--gold);font-style:italic}
.nav-links{display:flex;gap:32px}
.nav-link{font-size:13px;font-weight:500;color:var(--slate-m);cursor:pointer;transition:color .2s;background:none;border:none;font-family:'Jost',sans-serif}
.nav-link:hover{color:var(--slate)}
.nav-ctas{display:flex;gap:10px;align-items:center}

/* HERO */
.hero-wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 60px 80px;position:relative;overflow:hidden;text-align:center}
.hero-orbs{position:absolute;inset:0;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.35}
.orb1{width:500px;height:500px;background:radial-gradient(circle,var(--lav) 0%,transparent 70%);top:-80px;left:-80px;animation:orb1 8s ease-in-out infinite}
.orb2{width:400px;height:400px;background:radial-gradient(circle,var(--gold-p) 0%,transparent 70%);bottom:-60px;right:-60px;animation:orb2 10s ease-in-out infinite}
.orb3{width:300px;height:300px;background:radial-gradient(circle,rgba(61,63,92,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)}
.hero-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 16px;border-radius:20px;background:var(--white);border:1px solid var(--lav);font-size:12px;font-weight:500;color:var(--slate-m);margin-bottom:28px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulse 2s infinite}
.hero-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(48px,7vw,80px);line-height:1.08;font-weight:500;color:var(--slate);margin-bottom:20px;max-width:820px}
.hero-h1 em{font-style:italic;color:var(--slate-m)}
.gold-word{color:var(--gold);background:linear-gradient(120deg,var(--gold),var(--gold-l),var(--gold));background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
.hero-tagline{font-size:18px;line-height:1.65;color:var(--slate-m);max-width:520px;margin:0 auto 40px;font-weight:300}
.hero-tagline strong{color:var(--slate);font-weight:500}
.hero-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.hero-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--slate-l);font-family:'Jost Mono',monospace;cursor:pointer;animation:float 3s ease-in-out infinite}
.scroll-line{width:1px;height:32px;background:linear-gradient(to bottom,var(--lav-d),transparent)}

/* STATS */
.stats-strip{background:var(--slate);padding:36px 60px;display:flex;justify-content:center;gap:80px;flex-wrap:wrap}
.strip-stat{text-align:center}
.strip-val{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:500;color:var(--gold-l);line-height:1}
.strip-lbl{font-size:12px;color:var(--lav);margin-top:4px;letter-spacing:.5px}

/* SECTIONS */
.section{padding:100px 60px;max-width:1100px;margin:0 auto}
.section-eyebrow{font-family:'Jost Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:14px;display:flex;align-items:center;gap:8px}
.section-eyebrow::before{content:'';display:block;width:24px;height:1px;background:var(--gold)}
.section-h2{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:500;color:var(--slate);margin-bottom:16px;line-height:1.15}
.section-sub{font-size:16px;color:var(--slate-m);max-width:520px;line-height:1.7;font-weight:300;margin-bottom:56px}

/* STEPS */
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.step-card{background:var(--white);border:1px solid var(--cream-d);border-radius:var(--r-lg);padding:32px;transition:all .3s;cursor:default;position:relative;overflow:hidden}
.step-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--gold-l));transform:scaleX(0);transform-origin:left;transition:transform .4s ease}
.step-card:hover{border-color:var(--gold);transform:translateY(-4px);box-shadow:0 12px 40px rgba(184,169,106,.12)}
.step-card:hover::before{transform:scaleX(1)}
.step-num{font-family:'Cormorant Garamond',serif;font-size:52px;font-weight:300;color:var(--lav);line-height:1;margin-bottom:16px;transition:color .3s}
.step-card:hover .step-num{color:var(--gold-p)}
.step-icon{width:44px;height:44px;border-radius:12px;background:var(--gold-p);color:var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.step-title{font-size:17px;font-weight:600;color:var(--slate);margin-bottom:8px}
.step-desc{font-size:14px;color:var(--slate-m);line-height:1.6}

/* FEATURES */
.features-bg{background:var(--slate);padding:100px 60px}
.feat-inner{max-width:1100px;margin:0 auto}
.feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:56px}
.feat-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:var(--r-lg);padding:28px;transition:all .25s}
.feat-card:hover{background:rgba(255,255,255,.08);border-color:rgba(184,169,106,.4);transform:translateY(-3px)}
.feat-icon{width:44px;height:44px;border-radius:12px;background:rgba(184,169,106,.15);color:var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.feat-title{font-size:15px;font-weight:600;color:var(--white);margin-bottom:7px}
.feat-desc{font-size:13px;color:var(--lav);line-height:1.6}

/* TESTIMONIALS */
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:56px}
.testi-card{background:var(--white);border:1px solid var(--cream-d);border-radius:var(--r-lg);padding:28px;transition:all .25s}
.testi-card:hover{border-color:var(--gold);box-shadow:0 8px 32px rgba(184,169,106,.1)}
.testi-stars{display:flex;gap:3px;margin-bottom:14px;color:var(--gold)}
.testi-text{font-size:14px;color:var(--slate-m);line-height:1.65;margin-bottom:20px;font-style:italic}
.testi-author{display:flex;align-items:center;gap:10px}
.testi-av{width:36px;height:36px;border-radius:50%;background:var(--lav);display:flex;align-items:center;justify-content:center;color:var(--slate);font-size:14px;font-weight:600}
.testi-name{font-size:13px;font-weight:600;color:var(--slate)}
.testi-role{font-size:11px;color:var(--slate-l);margin-top:1px}

/* CTA */
.cta-band{background:linear-gradient(135deg,var(--slate) 0%,#2a2c45 100%);padding:80px 60px;text-align:center;position:relative;overflow:hidden}
.cta-band::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(184,169,106,.15) 0%,transparent 60%)}
.cta-h2{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:500;color:var(--white);margin-bottom:14px;position:relative}
.cta-sub{font-size:16px;color:var(--lav);margin-bottom:36px;position:relative;font-weight:300}
.cta-btns{display:flex;gap:12px;justify-content:center;position:relative}
.footer{background:#2a2c45;border-top:1px solid rgba(255,255,255,.06);padding:40px 60px;display:flex;align-items:center;justify-content:space-between}
.footer-brand{display:flex;align-items:center;gap:8px}
.footer-name{font-family:'Cormorant Garamond',serif;font-size:18px;color:var(--white);font-weight:500}
.footer-name span{color:var(--gold);font-style:italic}
.footer-copy{font-size:12px;color:var(--lav-x)}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:var(--r);font-family:'Jost',sans-serif;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:all .2s;text-decoration:none}
.btn-gold{background:var(--gold);color:var(--white);font-weight:600}
.btn-gold:hover{background:var(--gold-l);transform:translateY(-1px);box-shadow:0 4px 16px rgba(184,169,106,.35)}
.btn-ghost{background:transparent;color:var(--slate-m);border:1px solid var(--lav)}
.btn-ghost:hover{background:var(--cream);color:var(--slate);border-color:var(--lav-d)}
.btn-ghost-w{background:transparent;color:var(--white);border:1px solid rgba(255,255,255,.25)}
.btn-ghost-w:hover{background:rgba(255,255,255,.08)}
.btn-dark{background:var(--slate);color:var(--white)}
.btn-dark:hover{background:var(--slate-m);transform:translateY(-1px)}
.btn-sm{padding:8px 16px;font-size:12px}
.btn-lg{padding:14px 32px;font-size:15px;font-weight:600}

/* AUTH */
.auth-wrap{min-height:100vh;display:flex}
.auth-left{flex:1;background:var(--slate);display:flex;flex-direction:column;justify-content:center;padding:60px;position:relative;overflow:hidden}
.auth-orb1{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(184,169,106,.18) 0%,transparent 70%);top:-100px;right:-80px;animation:orb1 10s ease-in-out infinite}
.auth-orb2{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(200,204,224,.1) 0%,transparent 70%);bottom:-60px;left:-60px;animation:orb2 12s ease-in-out infinite}
.auth-left-content{position:relative;z-index:1}
.auth-brand{display:flex;align-items:center;gap:10px;margin-bottom:48px}
.auth-logo{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;color:var(--gold)}
.auth-brand-name{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--white)}
.auth-brand-name span{color:var(--gold);font-style:italic}
.auth-pitch-h{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:500;color:var(--white);line-height:1.15;margin-bottom:16px}
.auth-pitch-h em{color:var(--gold-l);font-style:italic}
.auth-pitch-p{font-size:15px;color:var(--lav);line-height:1.7;font-weight:300;max-width:360px;margin-bottom:40px}
.auth-bullets{display:flex;flex-direction:column;gap:12px}
.auth-bullet{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--lav)}
.auth-bullet-icon{width:24px;height:24px;border-radius:50%;background:rgba(184,169,106,.2);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.auth-right{width:480px;min-width:480px;display:flex;flex-direction:column;justify-content:center;padding:60px 52px;background:var(--cream)}
.auth-form-title{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--slate);margin-bottom:6px}
.auth-form-sub{font-size:14px;color:var(--slate-m);margin-bottom:36px}
.auth-form-sub span{color:var(--gold);cursor:pointer;font-weight:500}
.auth-form-sub span:hover{text-decoration:underline}
.form-group{margin-bottom:18px}
.form-label{display:block;font-size:12px;font-weight:500;color:var(--slate);margin-bottom:7px;letter-spacing:.3px}
.form-input-wrap{position:relative}
.form-input-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--lav-d);pointer-events:none}
.form-input{width:100%;background:var(--white);border:1.5px solid var(--cream-d);border-radius:var(--r);font-family:'Jost',sans-serif;font-size:14px;color:var(--slate);padding:12px 14px 12px 40px;outline:none;transition:all .2s}
.form-input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(184,169,106,.12)}
.form-input::placeholder{color:var(--lav)}
.eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--lav-d);padding:2px;transition:color .2s}
.eye-btn:hover{color:var(--slate)}
.divider{display:flex;align-items:center;gap:12px;margin:22px 0}
.div-line{flex:1;height:1px;background:var(--cream-d)}
.div-txt{font-size:12px;color:var(--slate-l)}
.social-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;border-radius:var(--r);border:1.5px solid var(--cream-d);background:var(--white);font-size:13px;font-weight:500;color:var(--slate);cursor:pointer;transition:all .2s;font-family:'Jost',sans-serif;margin-bottom:10px}
.social-btn:hover{border-color:var(--lav-d);background:var(--cream)}
.submit-btn{width:100%;padding:13px;background:var(--slate);color:var(--white);border:none;border-radius:var(--r);font-family:'Jost',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:8px}
.submit-btn:hover{background:var(--gold);transform:translateY(-1px);box-shadow:0 4px 16px rgba(184,169,106,.3)}
.submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.spinner{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:var(--white);animation:spin .7s linear infinite}
.terms-note{font-size:12px;color:var(--slate-l);text-align:center;margin-top:20px;line-height:1.5}
.terms-note span{color:var(--slate-m);cursor:pointer;text-decoration:underline}

/* APP SHELL */
.app-shell{display:flex;height:100vh;overflow:hidden}
.sb{width:280px;min-width:280px;background:var(--slate);display:flex;flex-direction:column;overflow-y:auto}
.sb-brand{padding:26px 22px 20px;border-bottom:1px solid rgba(255,255,255,.07)}
.sb-eyebrow{font-family:'Jost Mono',monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.sb-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--white);line-height:1.2}
.sb-title span{color:var(--gold);font-style:italic}
.sb-sec{padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.06)}
.sb-lbl{font-family:'Jost Mono',monospace;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--slate-l);margin-bottom:10px;display:flex;align-items:center;gap:5px}
.pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;margin-top:8px}
.pill.ok{background:rgba(74,124,95,.2);color:#7EC8A0}
.pill.no{background:rgba(184,169,106,.15);color:var(--gold-l)}
.tcards{display:flex;flex-direction:column;gap:4px}
.tcard{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--r);border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:all .15s}
.tcard:hover{background:rgba(255,255,255,.04);border-color:rgba(184,169,106,.25)}
.tcard.on{background:rgba(184,169,106,.1);border-color:var(--gold)}
.ticon{width:28px;height:28px;border-radius:var(--r);background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--slate-l);transition:all .15s}
.tcard.on .ticon{background:rgba(184,169,106,.2);color:var(--gold)}
.tname{font-size:12px;font-weight:500;color:var(--white)}
.tcard.on .tname{color:var(--gold-l)}
.tsub{font-size:10px;color:var(--slate-l);margin-top:1px}
.sel{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:var(--r);color:var(--white);font-family:'Jost',sans-serif;font-size:13px;padding:9px 12px;outline:none;appearance:none;cursor:pointer;margin-bottom:8px;transition:border-color .2s}
.sel:focus{border-color:var(--gold)}
.sel option{background:#3D3F5C}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.stat-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);padding:10px 12px}
.stat-val{font-family:'Cormorant Garamond',serif;font-size:21px;font-weight:600;color:var(--gold-l);line-height:1}
.stat-lbl{font-family:'Jost Mono',monospace;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--slate-l);margin-top:4px;display:flex;align-items:center;gap:4px}
.prog-wrap{margin-top:12px}
.prog-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.prog-lbl{font-size:11px;color:var(--slate-l)}
.prog-num{font-family:'Jost Mono',monospace;font-size:11px;color:var(--gold)}
.prog-track{height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-l));border-radius:2px;transition:width .6s ease}
.sb-foot{margin-top:auto;padding:14px 22px;border-top:1px solid rgba(255,255,255,.06)}
.sb-user{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px;border-radius:var(--r);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
.sb-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--lav),var(--slate-m));display:flex;align-items:center;justify-content:center;color:var(--white);font-size:13px;font-weight:600;flex-shrink:0}
.sb-uname{font-size:13px;font-weight:500;color:var(--white)}
.sb-uemail{font-size:10px;color:var(--slate-l);margin-top:1px}
.cost-row{display:flex;align-items:center;justify-content:space-between;background:rgba(184,169,106,.08);border:1px solid rgba(184,169,106,.18);border-radius:var(--r);padding:9px 12px}
.cost-lbl{font-size:11px;color:var(--slate-l);display:flex;align-items:center;gap:5px}
.cost-val{font-family:'Jost Mono',monospace;font-size:13px;color:var(--gold)}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:58px;background:var(--white);border-bottom:1px solid var(--cream-d);display:flex;align-items:center;justify-content:space-between;padding:0 32px;flex-shrink:0}
.topbar-l{display:flex;align-items:center;gap:12px}
.status-badge{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500}
.status-badge.idle{background:var(--cream-d);color:var(--slate-m)}
.status-badge.active{background:rgba(74,124,95,.12);color:var(--ok)}
.sdot{width:7px;height:7px;border-radius:50%}
.sdot.idle{background:var(--lav-d)}
.sdot.active{background:var(--ok);animation:blink 2s infinite}
.mode-tag{font-family:'Jost Mono',monospace;font-size:10px;color:var(--slate-m);padding:4px 10px;border:1px solid var(--lav);border-radius:3px}
.topbar-r{display:flex;gap:8px}

/* CONTEXT */
.ctx-wrap{flex:1;overflow-y:auto;padding:48px 52px}
.ctx-hero{max-width:600px;margin-bottom:40px}
.ctx-eyebrow{font-family:'Jost Mono',monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.ctx-h1{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,4vw,50px);line-height:1.12;font-weight:500;color:var(--slate);margin-bottom:12px}
.ctx-h1 em{font-style:italic;color:var(--slate-m)}
.ctx-desc{font-size:15px;line-height:1.7;color:var(--slate-m);max-width:440px;font-weight:300}
.feat-g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px}
.fc{background:var(--white);border:1px solid var(--cream-d);border-radius:var(--r-lg);padding:22px;transition:all .2s}
.fc:hover{border-color:var(--gold);box-shadow:0 6px 24px rgba(184,169,106,.12);transform:translateY(-2px)}
.fc-icon{width:38px;height:38px;border-radius:10px;background:var(--gold-p);color:var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.fc-title{font-weight:600;font-size:14px;color:var(--slate);margin-bottom:5px}
.fc-desc{font-size:13px;color:var(--slate-m);line-height:1.55}
.ctx-box{background:var(--white);border:1px solid var(--cream-d);border-radius:var(--r-lg);padding:32px;max-width:680px}
.ctx-box-title{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--slate);margin-bottom:4px}
.ctx-box-sub{font-size:13px;color:var(--slate-m);margin-bottom:18px}
.ctx-ta{width:100%;background:var(--cream);border:1.5px solid var(--cream-d);border-radius:var(--r);font-family:'Jost',sans-serif;font-size:14px;color:var(--slate);padding:14px 16px;resize:none;outline:none;line-height:1.6;transition:border-color .2s;min-height:108px}
.ctx-ta:focus{border-color:var(--gold)}
.ctx-ta::placeholder{color:var(--lav)}
.ctx-foot{display:flex;align-items:center;justify-content:space-between;margin-top:16px}
.char-ct{font-family:'Jost Mono',monospace;font-size:11px;color:var(--lav-d)}

/* INTERVIEW */
.iv-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden}
.iv-header{padding:16px 32px;background:var(--white);border-bottom:1px solid var(--cream-d);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.icard{display:flex;align-items:center;gap:12px}
.avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--lav),var(--slate));display:flex;align-items:center;justify-content:center;color:var(--white);flex-shrink:0;position:relative}
.av-dot{position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:var(--ok);border:2px solid var(--white)}
.iv-name{font-weight:600;font-size:15px;color:var(--slate)}
.iv-role{font-size:12px;color:var(--slate-m);margin-top:2px}
.q-track{display:flex;align-items:center;gap:10px}
.q-lbl{font-family:'Jost Mono',monospace;font-size:11px;color:var(--slate-m)}
.q-dots{display:flex;gap:4px}
.qdot{width:8px;height:8px;border-radius:50%;background:var(--lav);transition:background .3s}
.qdot.done{background:var(--gold)}
.qdot.cur{background:var(--slate)}
.chat{flex:1;overflow-y:auto;padding:28px 32px;display:flex;flex-direction:column;gap:22px;background:var(--cream)}
.mrow{display:flex;gap:12px;max-width:780px;animation:fadeUp .3s ease}
.mrow.user{align-self:flex-end;flex-direction:row-reverse}
.mav{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px}
.mav.ai{background:var(--slate);color:var(--white)}
.mav.usr{background:var(--gold-p);border:1px solid var(--gold);color:var(--gold)}
.mcont{max-width:600px}
.msend{font-size:11px;color:var(--slate-m);margin-bottom:5px;font-weight:500}
.mrow.user .msend{text-align:right}
.bubble{padding:14px 18px;line-height:1.65;font-size:14px}
.bubble.ai{background:var(--white);border:1px solid var(--cream-d);color:var(--slate);border-radius:2px 12px 12px 12px}
.bubble.user{background:var(--slate);color:var(--white);border-radius:12px 2px 12px 12px}
.ftags{display:flex;gap:6px;margin-top:8px}
.ftag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:3px;font-size:10px;font-weight:500}
.ftag.good{background:var(--ok-bg);color:var(--ok)}
.ftag.improve{background:var(--warn-bg);color:var(--warn-txt)}
.typing{display:flex;gap:12px;animation:fadeUp .3s ease}
.typing-dots{background:var(--white);border:1px solid var(--cream-d);padding:14px 18px;border-radius:2px 12px 12px 12px;display:flex;gap:5px;align-items:center}
.td{width:6px;height:6px;border-radius:50%;background:var(--lav-d);animation:tdot 1.2s infinite}
.td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
.inp-area{padding:14px 32px 18px;background:var(--white);border-top:1px solid var(--cream-d);flex-shrink:0}
.inp-wrap{display:flex;gap:10px;align-items:flex-end}
.chat-inp{flex:1;background:var(--cream);border:1.5px solid var(--cream-d);border-radius:var(--r-lg);font-family:'Jost',sans-serif;font-size:14px;color:var(--slate);padding:12px 16px;outline:none;resize:none;line-height:1.5;transition:border-color .2s;min-height:46px;max-height:120px}
.chat-inp:focus{border-color:var(--gold)}
.chat-inp::placeholder{color:var(--lav)}
.send-btn{width:44px;height:44px;border-radius:50%;background:var(--slate);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--white);flex-shrink:0;transition:all .15s}
.send-btn:hover{background:var(--gold);transform:scale(1.05)}
.send-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.chip-row{display:flex;gap:7px;margin-top:10px}
.chip{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid var(--cream-d);background:transparent;font-size:12px;color:var(--slate-m);cursor:pointer;font-family:'Jost',sans-serif;transition:all .15s}
.chip:hover{border-color:var(--gold);color:var(--gold);background:var(--gold-p)}

/* ERROR BANNER */
.err-banner{background:#FEE;border:1px solid #F5C6C6;border-radius:var(--r);padding:10px 14px;font-size:13px;color:#C0392B;margin-bottom:12px}

/* SCORECARD */
.backdrop{position:fixed;inset:0;background:rgba(61,63,92,.55);backdrop-filter:blur(5px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease}
.scorecard{background:var(--white);border-radius:var(--r-xl);padding:36px;width:500px;max-height:88vh;overflow-y:auto;box-shadow:0 24px 64px rgba(61,63,92,.2);animation:scaleIn .25s ease}
.sc-head{text-align:center;margin-bottom:28px}
.sc-ring{width:86px;height:86px;border-radius:50%;margin:0 auto 14px;position:relative;display:flex;align-items:center;justify-content:center}
.sc-ring-bg{position:absolute;inset:0;border-radius:50%}
.sc-ring-in{position:absolute;inset:10px;border-radius:50%;background:var(--white);display:flex;align-items:center;justify-content:center}
.sc-score{position:relative;font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;color:var(--slate)}
.sc-title{font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:var(--slate);margin-bottom:4px}
.sc-sub{font-size:13px;color:var(--slate-m)}
.sc-sec{margin-bottom:22px}
.sc-sec-lbl{font-family:'Jost Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--lav-d);margin-bottom:10px}
.sc-row{display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--cream-d)}
.sc-row:last-child{border-bottom:none}
.sc-row-lbl{font-size:13px;color:var(--slate)}
.sc-bar-wrap{display:flex;align-items:center;gap:9px}
.sc-bar{width:88px;height:4px;background:var(--cream-d);border-radius:2px;overflow:hidden}
.sc-bar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold-l));border-radius:2px}
.sc-pct{font-family:'Jost Mono',monospace;font-size:12px;color:var(--gold);width:32px;text-align:right}
.str-item,.imp-item{padding:10px 14px;border-radius:var(--r);font-size:13px;margin-bottom:6px;display:flex;align-items:flex-start;gap:9px;line-height:1.5}
.str-item{background:var(--ok-bg);color:#3A6B4F}
.imp-item{background:var(--warn-bg);color:var(--warn-txt)}
.sc-actions{display:flex;gap:8px;margin-top:24px}
.sc-actions .btn{flex:1;justify-content:center}
`;

/* ── DATA ─────────────────────────────────────────────────────────────────── */
const TECHS = [
  { id:"zero", Icon:Zap,           name:"Zero-Shot",        sub:"Direct instructions" },
  { id:"few",  Icon:Layout,        name:"Few-Shot",         sub:"Learning from examples" },
  { id:"cot",  Icon:Brain,         name:"Chain-of-Thought", sub:"Step-by-step reasoning" },
  { id:"role", Icon:User,          name:"Role-Based",       sub:"Expert persona" },
  { id:"fmt",  Icon:MessageSquare, name:"Structured",       sub:"Formatted output" },
];
const MODES  = ["Technical Interview","Behavioral Interview","Case Study Interview","System Design Interview"];
const LEVELS = ["Junior","Mid-level","Senior"];
const FEATS  = [
  { Icon:Brain,     title:"5 Coaching Techniques", desc:"Zero-shot to role-based personas. Each style unlocks a different depth of feedback." },
  { Icon:Zap,       title:"Instant Feedback",       desc:"Strengths and growth areas tagged on every response, not just at the end." },
  { Icon:BarChart2, title:"Performance Scorecard",  desc:"A structured competency breakdown after every session." },
  { Icon:Shield,    title:"4 Interview Types",      desc:"Technical, Behavioral, Case Study, and System Design — all in one place." },
  { Icon:Target,    title:"Adaptive Difficulty",    desc:"Junior, Mid-level, and Senior modes. The AI matches your level." },
  { Icon:Download,  title:"Export Sessions",        desc:"Download your full transcript to review or share with a mentor." },
];
const STEPS = [
  { n:"01", Icon:User,           title:"Create your profile",  desc:"Sign up in seconds. Tell us what role you're targeting and your experience level." },
  { n:"02", Icon:Brain,          title:"Choose your style",    desc:"Pick from five distinct AI coaching techniques. Each gives you a different interview experience." },
  { n:"03", Icon:MessageSquare,  title:"Practice & improve",   desc:"Get real-time feedback, hints, and a scorecard at the end of every session." },
];
const TESTIMONIALS = [
  { text:"NOUS AI gave me the confidence I'd been missing. The structured feedback after each answer helped me identify exactly where I was losing marks.", name:"Amara O.", role:"Software Engineer · Google", init:"AO" },
  { text:"I used to freeze on system design questions. After two weeks with NOUS, I sailed through a 3-hour technical round with ease.", name:"David K.", role:"Senior SDE · Amazon", init:"DK" },
  { text:"The role-based persona mode is unlike anything else. It felt like talking to a real hiring manager. I got the job.", name:"Suki L.", role:"Product Manager · Meta", init:"SL" },
];

/* ── HELPERS ─────────────────────────────────────────────────────────────── */
const bold = s => s.split(/\*\*(.*?)\*\*/g).map((p,i) => i%2===1 ? <strong key={i}>{p}</strong> : p);
const nl   = s => s.split("\n").map((l,i,a) => <span key={i}>{bold(l)}{i<a.length-1&&<br/>}</span>);
const time = () => new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

/* ── ROOT ────────────────────────────────────────────────────────────────── */
export default function NousAI() {
  const [screen, setScreen]   = useState("landing");
  const [appView, setAppView] = useState("context");
  const [user, setUser]       = useState(null);

  return (
    <>
      <style>{CSS}</style>
      {screen==="landing" && <Landing go={setScreen}/>}
      {screen==="login"   && <Login   go={setScreen} setUser={setUser}/>}
      {screen==="signup"  && <Signup  go={setScreen} setUser={setUser}/>}
      {screen==="app"     && <App     go={setScreen} user={user} view={appView} setView={setAppView}/>}
    </>
  );
}

/* ── LANDING ─────────────────────────────────────────────────────────────── */
function Landing({ go }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div>
      <nav className="land-nav" style={scrolled?{boxShadow:"0 2px 20px rgba(0,0,0,.08)"}:{}}>
        <div className="nav-brand">
          <div className="nav-logo"><Brain size={18}/></div>
          <div className="nav-name">NOUS <span>AI</span></div>
        </div>
        <div className="nav-links">
          <button className="nav-link">How it works</button>
          <button className="nav-link">Features</button>
          <button className="nav-link">Testimonials</button>
        </div>
        <div className="nav-ctas">
          <button className="btn btn-ghost btn-sm" onClick={()=>go("login")}>Sign in</button>
          <button className="btn btn-gold  btn-sm" onClick={()=>go("signup")}>Get started free</button>
        </div>
      </nav>

      <div className="hero-wrap">
        <div className="hero-orbs">
          <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>
        </div>
        <div className="hero-badge anim-fade-up">
          <div className="hero-badge-dot"/>
          AI-powered · Real-time feedback · 5 coaching techniques
        </div>
        <h1 className="hero-h1 anim-fade-up d1">
          Master every interview<br/>with <span className="gold-word">NOUS AI</span>
        </h1>
        <p className="hero-tagline anim-fade-up d2">
          The intelligent interview coach that adapts to <strong>your role, your level, your goals</strong> — and tells you exactly how to improve.
        </p>
        <div className="hero-ctas anim-fade-up d3">
          <button className="btn btn-gold btn-lg" onClick={()=>go("signup")}>Start practising free <ArrowRight size={16}/></button>
          <button className="btn btn-ghost btn-lg" onClick={()=>go("login")}>Sign in</button>
        </div>
        <div className="hero-scroll"><div className="scroll-line"/>SCROLL</div>
      </div>

      <div className="stats-strip">
        {[["10,000+","Interviews practised"],["94%","Users feel more confident"],["5","Coaching techniques"],["4.9★","Average rating"]].map(([v,l])=>(
          <div key={l} className="strip-stat anim-fade-up">
            <div className="strip-val">{v}</div>
            <div className="strip-lbl">{l}</div>
          </div>
        ))}
      </div>

      <div style={{background:"var(--cream)"}}>
        <div className="section">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-h2">Three steps to interview confidence</h2>
          <p className="section-sub">No complicated setup. No generic Q&A banks. Just focused, adaptive practice that mirrors the real thing.</p>
          <div className="steps-grid">
            {STEPS.map(({n,Icon,title,desc},i)=>(
              <div key={n} className={`step-card anim-fade-up d${i+1}`}>
                <div className="step-num">{n}</div>
                <div className="step-icon"><Icon size={20}/></div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="features-bg">
        <div className="feat-inner">
          <div className="section-eyebrow" style={{color:"var(--gold)"}}>Features</div>
          <h2 className="section-h2" style={{color:"var(--white)"}}>Everything you need to prepare</h2>
          <p className="section-sub" style={{color:"var(--lav)"}}>Built for serious candidates who want more than practice — they want to understand their performance.</p>
          <div className="feat-grid">
            {FEATS.map(({Icon,title,desc},i)=>(
              <div key={title} className={`feat-card anim-fade-up d${i+1}`}>
                <div className="feat-icon"><Icon size={18}/></div>
                <div className="feat-title">{title}</div>
                <div className="feat-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{background:"var(--cream)"}}>
        <div className="section">
          <div className="section-eyebrow">Testimonials</div>
          <h2 className="section-h2">From candidates who landed the role</h2>
          <p className="section-sub">Real feedback from real people who practised with NOUS AI before their interviews.</p>
          <div className="testi-grid">
            {TESTIMONIALS.map((t,i)=>(
              <div key={t.name} className={`testi-card anim-fade-up d${i+1}`}>
                <div className="testi-stars">{[...Array(5)].map((_,j)=><Star key={j} size={13} fill="currentColor"/>)}</div>
                <p className="testi-text">"{t.text}"</p>
                <div className="testi-author">
                  <div className="testi-av">{t.init}</div>
                  <div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cta-band">
        <h2 className="cta-h2 anim-fade-up">Ready to ace your next interview?</h2>
        <p className="cta-sub anim-fade-up d1">Join thousands of candidates who practise smarter, not harder.</p>
        <div className="cta-btns anim-fade-up d2">
          <button className="btn btn-gold btn-lg" onClick={()=>go("signup")}>Get started — it's free <ArrowRight size={16}/></button>
          <button className="btn btn-ghost-w btn-lg" onClick={()=>go("login")}>Sign in</button>
        </div>
      </div>

      <div className="footer">
        <div className="footer-brand">
          <div className="nav-logo"><Brain size={16}/></div>
          <div className="footer-name">NOUS <span>AI</span></div>
        </div>
        <div className="footer-copy">© 2025 NOUS AI Interview Coach. All rights reserved.</div>
      </div>
    </div>
  );
}

/* ── LOGIN ───────────────────────────────────────────────────────────────── */
function Login({ go, setUser }) {
  const [email, setEmail]     = useState("");
  const [pass,  setPass]      = useState("");
  const [show,  setShow]      = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,   setErr]       = useState("");

  function submit() {
    if (!email || !pass) { setErr("Please fill in all fields."); return; }
    setErr(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser({ name: email.split("@")[0], email });
      go("app");
    }, 1200);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-orb1"/><div className="auth-orb2"/>
        <div className="auth-left-content">
          <div className="auth-brand anim-slide-r">
            <div className="auth-logo"><Brain size={20}/></div>
            <div className="auth-brand-name">NOUS <span>AI</span></div>
          </div>
          <h2 className="auth-pitch-h anim-slide-r d1">Interviews are<br/><em>won in practice.</em></h2>
          <p className="auth-pitch-p anim-slide-r d2">The intelligent coach that adapts to your goals and tells you exactly how to close the gap between where you are and where you want to be.</p>
          <div className="auth-bullets anim-slide-r d3">
            {["Real-time feedback on every response","5 distinct coaching techniques","Performance scorecard after every session","Technical, behavioral & case study modes"].map(b=>(
              <div key={b} className="auth-bullet">
                <div className="auth-bullet-icon"><CheckCircle size={12}/></div>{b}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="anim-fade-up">
          <div className="auth-form-title">Welcome back</div>
          <div className="auth-form-sub">Don't have an account? <span onClick={()=>go("signup")}>Create one free</span></div>
          {err && <div className="err-banner">{err}</div>}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="form-input-wrap">
              <div className="form-input-icon"><Mail size={15}/></div>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <div className="form-input-icon"><Lock size={15}/></div>
              <input className="form-input" type={show?"text":"password"} placeholder="••••••••"
                value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              <button className="eye-btn" onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <button className="submit-btn" onClick={submit} disabled={loading}>
            {loading?<><div className="spinner"/>Signing in…</>:<>Sign in <ArrowRight size={15}/></>}
          </button>
          <div className="divider"><div className="div-line"/><span className="div-txt">or continue with</span><div className="div-line"/></div>
          <button className="social-btn">
            <GoogleIcon/> Continue with Google
          </button>
          <div className="terms-note">By signing in you agree to our <span>Terms of Service</span> and <span>Privacy Policy</span>.</div>
        </div>
      </div>
    </div>
  );
}

/* ── SIGNUP ──────────────────────────────────────────────────────────────── */
function Signup({ go, setUser }) {
  const [name,  setName]      = useState("");
  const [email, setEmail]     = useState("");
  const [pass,  setPass]      = useState("");
  const [show,  setShow]      = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,   setErr]       = useState("");

  function submit() {
    if (!name||!email||!pass) { setErr("Please fill in all fields."); return; }
    if (pass.length<8)        { setErr("Password must be at least 8 characters."); return; }
    setErr(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser({ name, email });
      go("app");
    }, 1400);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div className="auth-orb1"/><div className="auth-orb2"/>
        <div className="auth-left-content">
          <div className="auth-brand anim-slide-r">
            <div className="auth-logo"><Brain size={20}/></div>
            <div className="auth-brand-name">NOUS <span>AI</span></div>
          </div>
          <h2 className="auth-pitch-h anim-slide-r d1">Your next interview<br/><em>starts here.</em></h2>
          <p className="auth-pitch-p anim-slide-r d2">Create your free account and start practising in under two minutes. No credit card required.</p>
          <div className="auth-bullets anim-slide-r d3">
            {["Free to start, no credit card needed","Unlimited practice sessions","5 coaching styles to choose from","Detailed scorecard after every session"].map(b=>(
              <div key={b} className="auth-bullet">
                <div className="auth-bullet-icon"><CheckCircle size={12}/></div>{b}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="anim-fade-up">
          <div className="auth-form-title">Create your account</div>
          <div className="auth-form-sub">Already have one? <span onClick={()=>go("login")}>Sign in instead</span></div>
          {err && <div className="err-banner">{err}</div>}
          <button className="social-btn" style={{marginBottom:16}}><GoogleIcon/> Sign up with Google</button>
          <div className="divider"><div className="div-line"/><span className="div-txt">or with email</span><div className="div-line"/></div>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div className="form-input-wrap">
              <div className="form-input-icon"><User size={15}/></div>
              <input className="form-input" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div className="form-input-wrap">
              <div className="form-input-icon"><Mail size={15}/></div>
              <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <div className="form-input-icon"><Lock size={15}/></div>
              <input className="form-input" type={show?"text":"password"} placeholder="Min. 8 characters"
                value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}/>
              <button className="eye-btn" onClick={()=>setShow(s=>!s)}>{show?<EyeOff size={15}/>:<Eye size={15}/>}</button>
            </div>
          </div>
          <button className="submit-btn" onClick={submit} disabled={loading}>
            {loading?<><div className="spinner"/>Creating account…</>:<>Create account <ArrowRight size={15}/></>}
          </button>
          <div className="terms-note">By creating an account you agree to our <span>Terms of Service</span> and <span>Privacy Policy</span>.</div>
        </div>
      </div>
    </div>
  );
}

/* ── APP ─────────────────────────────────────────────────────────────────── */
function App({ go, user, view, setView }) {
  const [tech,      setTech]      = useState("role");
  const [mode,      setMode]      = useState(MODES[0]);
  const [level,     setLevel]     = useState("Senior");
  const [apiKey,    setApiKey]    = useState("");
  const [ctx,       setCtx]       = useState("");
  const [msgs,      setMsgs]      = useState([]);
  const [inp,       setInp]       = useState("");
  const [typing,    setTyping]    = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTok,  setTotalTok]  = useState(0);
  const [apiErr,    setApiErr]    = useState("");
  const [elapsed,   setElapsed]   = useState(0);
  const chatRef   = useRef(null);
  const startTime = useRef(null);

  const qCount = msgs.filter(m=>m.role==="assistant").length;
  const maxQ   = 8;

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typing]);

  useEffect(() => {
    if (view==="interview") {
      startTime.current = Date.now();
      const t = setInterval(()=>setElapsed(Math.floor((Date.now()-startTime.current)/1000)), 1000);
      return ()=>clearInterval(t);
    }
  }, [view]);

  const fmtTime = s => `${Math.floor(s/60)}m ${s%60}s`;

  async function startInterview() {
    if (!ctx.trim()) return;
    setView("interview");
    setTyping(true);
    setApiErr("");
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          api_key: apiKey,
          messages: [],
          context: ctx,
          mode, level, technique: tech,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "API error");
      setMsgs([{role:"assistant", content:data.message, time:time(), tags:[]}]);
      setTotalCost(c=>c+data.cost);
      setTotalTok(t=>t+data.tokens.input+data.tokens.output);
    } catch(e) {
      setApiErr(e.message);
      setView("context");
    } finally {
      setTyping(false);
    }
  }

  async function send() {
    if (!inp.trim()||typing) return;
    const userMsg = {role:"user", content:inp, time:time(), tags:[]};
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInp("");
    setTyping(true);
    setApiErr("");
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          api_key: apiKey,
          messages: newMsgs.map(m=>({role:m.role, content:m.content})),
          context: ctx, mode, level, technique: tech,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "API error");
      const content  = data.message;
      const hasGood  = content.toLowerCase().includes("strength") || content.toLowerCase().includes("strong") || content.toLowerCase().includes("well");
      const hasImp   = content.toLowerCase().includes("improve") || content.toLowerCase().includes("consider") || content.toLowerCase().includes("nuance");
      setMsgs(p=>[...p,{role:"assistant",content,time:time(),tags:[...(hasGood?["good"]:[]),...(hasImp?["improve"]:[])]}]);
      setTotalCost(c=>c+data.cost);
      setTotalTok(t=>t+data.tokens.input+data.tokens.output);
    } catch(e) {
      setApiErr(e.message);
    } finally {
      setTyping(false);
    }
  }

  async function fetchScorecard() {
    if (!msgs.length) return;
    setShowScore(true);
    setScoreData(null);
    try {
      const res = await fetch(`${API_BASE}/scorecard`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          api_key: apiKey,
          messages: msgs.map(m=>({role:m.role,content:m.content})),
          mode, level,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Scorecard error");
      setScoreData(data);
    } catch(e) {
      setApiErr(e.message);
      setShowScore(false);
    }
  }

  function exportChat() {
    const txt = msgs.map(m=>`[${m.role.toUpperCase()}] ${m.time}\n${m.content}`).join("\n\n---\n\n");
    const b = new Blob([txt], {type:"text/plain"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `nous-interview-${Date.now()}.txt`;
    a.click();
  }

  function onKey(e) { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }
  const initials = user?.name?.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"U";

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="sb">
        <div className="sb-brand">
          <div className="sb-eyebrow">NOUS AI</div>
          <div className="sb-title">Interview<br/><span>Coach</span></div>
        </div>

        <div className="sb-sec">
          <div className="sb-lbl"><Key size={10}/> OpenAI Key</div>
          <div style={{position:"relative"}}>
            <input
              style={{width:"100%",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:4,color:"white",fontFamily:"'Jost Mono',monospace",fontSize:12,padding:"10px 32px 10px 12px",outline:"none"}}
              type="password" placeholder="sk-proj-..."
              value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
            <div style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:8,height:8,borderRadius:"50%",background:apiKey?"var(--ok)":"var(--slate-l)"}}/>
          </div>
          {apiKey
            ? <span className="pill ok"><CheckCircle size={10}/>Connected</span>
            : <span className="pill no"><Circle size={10}/>Required</span>}
        </div>

        <div className="sb-sec">
          <div className="sb-lbl"><Brain size={10}/> Technique</div>
          <div className="tcards">
            {TECHS.map(({id,Icon,name,sub})=>(
              <div key={id} className={`tcard ${tech===id?"on":""}`} onClick={()=>setTech(id)}>
                <div className="ticon"><Icon size={13}/></div>
                <div><div className="tname">{name}</div><div className="tsub">{sub}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="sb-sec">
          <div className="sb-lbl"><Layout size={10}/> Settings</div>
          <select className="sel" value={mode} onChange={e=>setMode(e.target.value)}>
            {MODES.map(m=><option key={m}>{m}</option>)}
          </select>
          <select className="sel" value={level} onChange={e=>setLevel(e.target.value)}>
            {LEVELS.map(l=><option key={l}>{l}</option>)}
          </select>
        </div>

        {view==="interview"&&(
          <div className="sb-sec">
            <div className="sb-lbl"><BarChart2 size={10}/> Session</div>
            <div className="stat-grid">
              <div className="stat-box"><div className="stat-val">{qCount}</div><div className="stat-lbl"><Hash size={9}/>Qs</div></div>
              <div className="stat-box"><div className="stat-val">{fmtTime(elapsed)}</div><div className="stat-lbl"><Clock size={9}/>Time</div></div>
              <div className="stat-box"><div className="stat-val">{totalTok>999?`${(totalTok/1000).toFixed(1)}k`:totalTok}</div><div className="stat-lbl"><Zap size={9}/>Tokens</div></div>
              <div className="stat-box"><div className="stat-val">${totalCost.toFixed(4)}</div><div className="stat-lbl"><DollarSign size={9}/>Cost</div></div>
            </div>
            <div className="prog-wrap">
              <div className="prog-head">
                <span className="prog-lbl">Progress</span>
                <span className="prog-num">{Math.min(qCount,maxQ)}/{maxQ}</span>
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{width:`${(Math.min(qCount,maxQ)/maxQ)*100}%`}}/>
              </div>
            </div>
          </div>
        )}

        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div>
              <div className="sb-uname">{user?.name||"User"}</div>
              <div className="sb-uemail">{user?.email||""}</div>
            </div>
          </div>
          <div className="cost-row">
            <span className="cost-lbl"><DollarSign size={11}/>Est. cost</span>
            <span className="cost-val">${totalCost.toFixed(4)}</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <div className="topbar-l">
            <div className={`status-badge ${view==="interview"?"active":"idle"}`}>
              <div className={`sdot ${view==="interview"?"active":"idle"}`}/>
              {view==="interview"?"Session active":"Ready to start"}
            </div>
            {view==="interview"&&<div className="mode-tag">{mode} · {level}</div>}
          </div>
          <div className="topbar-r">
            {view==="interview"&&<>
              <button className="btn btn-ghost btn-sm" onClick={fetchScorecard}><BarChart2 size={13}/>Scorecard</button>
              <button className="btn btn-ghost btn-sm" onClick={exportChat}><Download size={13}/>Export</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>{setView("context");setMsgs([]);setTotalCost(0);setTotalTok(0);setElapsed(0);}}>
                <RotateCcw size={13}/>New Session
              </button>
            </>}
            <button className="btn btn-ghost btn-sm" onClick={()=>go("landing")} title="Sign out"><LogOut size={13}/></button>
          </div>
        </div>

        {/* CONTEXT */}
        {view==="context"&&(
          <div className="ctx-wrap">
            <div className="ctx-hero">
              <div className="ctx-eyebrow anim-fade-up">Welcome back, {user?.name?.split(" ")[0]||"there"}</div>
              <h1 className="ctx-h1 anim-fade-up d1">What are you<br/><em>preparing for?</em></h1>
              <p className="ctx-desc anim-fade-up d2">The more context you give, the sharper your questions will be.</p>
            </div>
            <div className="feat-g3">
              {[
                {Icon:Brain,    title:"5 Coaching Styles", desc:"Pick the technique that fits how you learn best."},
                {Icon:Zap,      title:"Inline Feedback",   desc:"Strengths and growth tags on every AI response."},
                {Icon:BarChart2,title:"Scorecard",         desc:"Competency breakdown at the end of every session."},
              ].map(({Icon,title,desc},i)=>(
                <div key={title} className={`fc anim-fade-up d${i+2}`}>
                  <div className="fc-icon"><Icon size={17}/></div>
                  <div className="fc-title">{title}</div>
                  <div className="fc-desc">{desc}</div>
                </div>
              ))}
            </div>
            {apiErr&&<div className="err-banner" style={{maxWidth:680,marginBottom:12}}>{apiErr}</div>}
            <div className="ctx-box anim-fade-up d4">
              <div className="ctx-box-title">Describe your preparation goals</div>
              <div className="ctx-box-sub">Role, company type, topics to work on, experience level, weaknesses to address.</div>
              <textarea className="ctx-ta" rows={4}
                placeholder="e.g. I'm interviewing for a Senior Backend Engineer role at a fintech startup next week. I want to focus on system design and distributed systems..."
                value={ctx} onChange={e=>setCtx(e.target.value)}/>
              <div className="ctx-foot">
                <span className="char-ct">{ctx.length} / 2000</span>
                <button className="btn btn-gold"
                  style={{opacity:(ctx.trim()&&apiKey)?1:.45}}
                  onClick={startInterview}>
                  Start Interview <ArrowRight size={14}/>
                </button>
              </div>
              {!apiKey&&<p style={{fontSize:12,color:"var(--gold)",marginTop:8}}>⚠ Enter your OpenAI API key in the sidebar to begin.</p>}
            </div>
          </div>
        )}

        {/* INTERVIEW */}
        {view==="interview"&&(
          <div className="iv-wrap">
            <div className="iv-header">
              <div className="icard">
                <div className="avatar"><User size={17}/><div className="av-dot"/></div>
                <div>
                  <div className="iv-name">Sarah Chen</div>
                  <div className="iv-role">Sr. Engineering Manager · {TECHS.find(t=>t.id===tech)?.name} mode</div>
                </div>
              </div>
              <div className="q-track">
                <span className="q-lbl">Q{Math.min(qCount,maxQ)}/{maxQ}</span>
                <div className="q-dots">
                  {Array.from({length:maxQ}).map((_,i)=>(
                    <div key={i} className={`qdot ${i<qCount-1?"done":i===qCount-1?"cur":""}`}/>
                  ))}
                </div>
              </div>
            </div>

            <div className="chat" ref={chatRef}>
              {msgs.map((m,i)=>(
                <div key={i} className={`mrow ${m.role==="user"?"user":""}`}>
                  <div className={`mav ${m.role==="user"?"usr":"ai"}`}><User size={14}/></div>
                  <div className="mcont">
                    <div className="msend">{m.role==="user"?"You":"Sarah Chen"} · {m.time}</div>
                    <div className={`bubble ${m.role==="user"?"user":"ai"}`}>{nl(m.content)}</div>
                    {m.tags?.length>0&&(
                      <div className="ftags">
                        {m.tags.includes("good")&&<span className="ftag good"><CheckCircle size={10}/>Strong response</span>}
                        {m.tags.includes("improve")&&<span className="ftag improve"><TrendingUp size={10}/>Room to grow</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing&&(
                <div className="typing">
                  <div className="mav ai"><User size={14}/></div>
                  <div className="typing-dots"><div className="td"/><div className="td"/><div className="td"/></div>
                </div>
              )}
            </div>

            {apiErr&&<div className="err-banner" style={{margin:"0 32px 8px"}}>{apiErr}</div>}

            <div className="inp-area">
              <div className="inp-wrap">
                <textarea className="chat-inp" rows={1}
                  placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                  value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={onKey}
                  disabled={typing}/>
                <button className="send-btn" onClick={send} disabled={typing||!inp.trim()}><Send size={15}/></button>
              </div>
              <div className="chip-row">
                <button className="chip" onClick={()=>setInp("Can you give me a hint?")}><Lightbulb size={12}/>Give me a hint</button>
                <button className="chip" onClick={()=>{ setInp("Please skip to the next question."); }}><SkipForward size={12}/>Skip question</button>
                <button className="chip" onClick={()=>setInp("Can you rephrase that question?")}><RefreshCw size={12}/>Rephrase</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* SCORECARD MODAL */}
      {showScore&&(
        <div className="backdrop" onClick={()=>setShowScore(false)}>
          <div className="scorecard" onClick={e=>e.stopPropagation()}>
            {!scoreData?(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div className="spinner" style={{margin:"0 auto 14px",width:28,height:28,borderWidth:3}}/>
                <p style={{color:"var(--slate-m)",fontSize:14}}>Generating your scorecard…</p>
              </div>
            ):(
              <>
                <div className="sc-head">
                  <div className="sc-ring">
                    <div className="sc-ring-bg" style={{background:`conic-gradient(var(--gold) 0% ${scoreData.overall}%, var(--lav) ${scoreData.overall}%)`}}/>
                    <div className="sc-ring-in"><span className="sc-score">{scoreData.overall}</span></div>
                  </div>
                  <div className="sc-title">Session Scorecard</div>
                  <div className="sc-sub">{mode} · {level} · {qCount} questions</div>
                </div>
                <div className="sc-sec">
                  <div className="sc-sec-lbl">Competency Breakdown</div>
                  {scoreData.competencies?.map(({label,score})=>(
                    <div key={label} className="sc-row">
                      <span className="sc-row-lbl">{label}</span>
                      <div className="sc-bar-wrap">
                        <div className="sc-bar"><div className="sc-bar-fill" style={{width:`${score}%`}}/></div>
                        <span className="sc-pct">{score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="sc-sec">
                  <div className="sc-sec-lbl">Strengths</div>
                  {scoreData.strengths?.map(s=>(
                    <div key={s} className="str-item"><CheckCircle size={12} style={{flexShrink:0}}/>{s}</div>
                  ))}
                </div>
                <div className="sc-sec">
                  <div className="sc-sec-lbl">Areas to Improve</div>
                  {scoreData.improvements?.map(s=>(
                    <div key={s} className="imp-item"><TrendingUp size={12} style={{flexShrink:0}}/>{s}</div>
                  ))}
                </div>
                <div className="sc-actions">
                  <button className="btn btn-ghost" onClick={()=>setShowScore(false)}><X size={13}/>Close</button>
                  <button className="btn btn-ghost" onClick={exportChat}><Download size={13}/>Export</button>
                  <button className="btn btn-gold" onClick={()=>{setShowScore(false);setView("context");setMsgs([]);setTotalCost(0);setTotalTok(0);setElapsed(0);}}>
                    <RotateCcw size={13}/>New Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── GOOGLE ICON ─────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}