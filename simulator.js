/* ===========================
   ZENDESK INTERACTIVE SIMULATOR
   =========================== */

/* ── Scene renderers ── */

function renderGlobalTopBar(scene) {
  const tabs = scene.tabs || [];
  return `
  <div class="zd-globalbar">
    <div class="zd-logo">Z</div>
    <span class="zd-brand">Support ▾</span>
    <span class="zd-add">+ Add</span>
    <div class="zd-ticket-tabs">
      ${tabs.map((t,i)=>`<div class="zd-ticket-tab ${i===0?'active':''}">${t.icon||'📄'} ${t.title} <span class="tab-x">×</span></div>`).join('')}
    </div>
    <div class="zd-right">
      <div class="zd-icon-btn">🔍</div>
      <div class="zd-icon-btn" style="font-size:12px;gap:2px;width:auto;padding:0 6px;">Conversations <span style="background:#D8DCDE;padding:1px 5px;border-radius:10px;font-size:10px">0</span></div>
      <div class="zd-icon-btn">🔔<span class="zd-badge">9</span></div>
      <div class="zd-icon-btn">⊞</div>
      <div class="zd-icon-btn" style="background:#8B5CF6;color:white;border-radius:50%;">S</div>
    </div>
    ${tabs.length ? `<button class="zd-next-btn">Next →</button>` : ''}
  </div>`;
}

/* ── TICKET SCENE ── */
function renderTicketScene(setup, L) {
  const s = Object.assign({
    subject: 'J\'ai une demande',
    requester: 'Guillaume Garcia',
    assignee: 'Assistance/Guillaume Garcia',
    group: 'Support',
    brand: 'OmyCare',
    status: 'pending',
    type: '-',
    priority: 'normal',
    via: L==='fr'?'Formulaire web':'Web form',
    topic: L==='fr'?'Candidature':'Job application',
    sentiment: 'Neutral',
    messages: [],
    composerMode: 'public',
    macros: []
  }, setup);
  // Auto-generate email from requester name if not provided
  if (!s.requesterEmail) {
    s.requesterEmail = s.requester.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
  }
  window._simSetup = s;

  const statusMap = {
    new:'New', open:'Open', pending:'Pending', hold:'On-hold', solved:'Solved', closed:'Closed'
  };
  const submitLabel = L==='fr'
    ? `Soumettre comme ${statusMap[s.status]||'Ouvert'}`
    : `Submit as ${statusMap[s.status]||'Open'}`;

  const defaultMacros = [
    { icon:'🔑', name: L==='fr'?'Réinitialisation mot de passe':'Password reset',
      actions:[
        {type:'reply', text:{fr:'Bonjour {{first_name}},\n\nPour réinitialiser votre mot de passe :\n1. Rendez-vous sur la page de connexion\n2. Cliquez sur "Mot de passe oublié"\n3. Entrez votre adresse email et suivez les instructions reçues\n\nN\'hésitez pas à nous contacter si besoin.\n\nCordialement,\nL\'équipe OmyCare', en:'Hello {{first_name}},\n\nTo reset your password:\n1. Go to the login page\n2. Click "Forgot password"\n3. Enter your email address and follow the instructions\n\nFeel free to contact us if you need further help.\n\nBest regards,\nThe OmyCare team'}},
        {type:'status', value:'pending'}
      ]},
    { icon:'⏳', name: L==='fr'?'Client n\'a pas répondu':'Customer hasn\'t responded',
      actions:[
        {type:'reply', text:{fr:'Bonjour {{first_name}},\n\nNous n\'avons pas eu de vos nouvelles depuis quelques jours. Votre demande est-elle toujours d\'actualité ?\n\nSans retour de votre part sous 48h, nous clôturerons ce ticket.\n\nCordialement,\nL\'équipe OmyCare', en:'Hello {{first_name}},\n\nWe have not heard from you in a few days. Is your request still relevant?\n\nWithout a reply within 48h, we will close this ticket.\n\nBest regards,\nThe OmyCare team'}},
        {type:'status', value:'pending'}
      ]},
    { icon:'✅', name: L==='fr'?'Résolution standard':'Standard resolution',
      actions:[
        {type:'reply', text:{fr:'Bonjour {{first_name}},\n\nNous espérons que votre problème est à présent résolu. N\'hésitez pas à nous recontacter si vous avez d\'autres questions.\n\nCordialement,\nL\'équipe OmyCare', en:'Hello {{first_name}},\n\nWe hope your issue is now resolved. Please do not hesitate to contact us again if you have any further questions.\n\nBest regards,\nThe OmyCare team'}},
        {type:'status', value:'solved'}
      ]},
    { icon:'🔄', name: L==='fr'?'Escalade Niveau 2':'Level 2 escalation',
      actions:[
        {type:'internal', text:{fr:'[Niveau 2] Ce ticket nécessite une expertise technique approfondie — escalade depuis le support Niveau 1.', en:'[Level 2] This ticket requires deep technical expertise — escalating from Level 1 support.'}},
        {type:'priority', value:'high'}
      ]},
  ];
  const macros = (s.macros && s.macros.length) ? s.macros : defaultMacros;
  window._simMacros = macros;

  const defaultMessages = [
    {
      author: s.requester, time: 'Oct 01, 10:37', internal: false,
      text: L==='fr' ? 'Bonjour,\n\nJ\'ai une demande svp ?' : 'Hello,\n\nI have a request please?'
    }
  ];
  const messages = s.messages.length ? s.messages : defaultMessages;

  return `
  ${renderGlobalTopBar({ tabs:[{ title: s.subject }] })}
  <!-- breadcrumb -->
  <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;background:white;border-bottom:1px solid #D8DCDE;font-size:12px;color:#49545C">
    <span style="color:#1F73B7;cursor:pointer">${L==='fr'?'Retour':'Back'}</span>
    <span>›</span>
    <span class="zd-status-pill sp-${s.status}" id="ticket-status-pill">${statusMap[s.status]||'Open'}</span>
    <span>${L==='fr'?'Ticket':'Ticket'} #${s.ticketId||'13'}</span>
  </div>
  <div class="zd-ticket-layout">

    <!-- LEFT PROPS PANEL -->
    <div class="zd-props" id="zd-props">
      <div class="zd-prop-group">
        <div class="zd-prop-label">${L==='fr'?'Marque':'Brand'}</div>
        <div class="zd-prop-field" id="field-brand">
          <span class="pf-icon">🏷️</span><span class="pf-val">${s.brand}</span><span class="pf-arr">▾</span>
        </div>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">${L==='fr'?'Demandeur':'Requester'}</div>
        <div class="zd-prop-field" id="field-requester" style="cursor:pointer">
          <span class="pf-icon">👤</span><span class="pf-val" style="color:#1F73B7">${s.requester.toLowerCase().replace(' ','')}</span><span class="pf-arr">▾</span>
        </div>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">${L==='fr'?'Assigné à':'Assignee'} <span class="zd-take-it" id="take-it-link">${L==='fr'?'me l\'attribuer':'take it'}</span></div>
        <div class="zd-prop-field" id="field-assignee">
          <span class="pf-icon">👥</span><span class="pf-val">${s.assignee}</span><span class="pf-arr">▾</span>
        </div>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">${L==='fr'?'Abonnés':'Followers'}</div>
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;padding:4px 0">
          <div style="background:#EBF5FB;color:#1F73B7;font-size:11px;padding:3px 8px;border-radius:3px;display:flex;align-items:center;gap:4px">
            <span style="width:16px;height:16px;background:#8B5CF6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:white;font-size:9px">S</span>
            ${s.requester.split(' ')[0]}
            <span style="color:#87929D;cursor:pointer">×</span>
          </div>
        </div>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">Type</div>
        <div style="position:relative">
          <select class="zd-prop-select" id="field-type" onchange="simSelectChange('type', this.value)">
            <option value="-" ${s.type==='-'?'selected':''}>-</option>
            <option value="question" ${s.type==='question'?'selected':''}>${L==='fr'?'Question':'Question'}</option>
            <option value="incident" ${s.type==='incident'?'selected':''}>${L==='fr'?'Incident':'Incident'}</option>
            <option value="problem" ${s.type==='problem'?'selected':''}>${L==='fr'?'Problème':'Problem'}</option>
            <option value="task" ${s.type==='task'?'selected':''}>${L==='fr'?'Tâche':'Task'}</option>
          </select>
        </div>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">${L==='fr'?'Priorité':'Priority'}</div>
        <select class="zd-prop-select" id="field-priority" onchange="simSelectChange('priority', this.value)">
          <option value="low" ${s.priority==='low'?'selected':''}>${L==='fr'?'Basse':'Low'}</option>
          <option value="normal" ${s.priority==='normal'?'selected':''}>${L==='fr'?'Normale':'Normal'}</option>
          <option value="high" ${s.priority==='high'?'selected':''}>${L==='fr'?'Haute':'High'}</option>
          <option value="urgent" ${s.priority==='urgent'?'selected':''}>${L==='fr'?'Urgente':'Urgent'}</option>
        </select>
      </div>
      <div class="zd-prop-group">
        <div class="zd-prop-label">Tags</div>
        <div class="zd-tags-wrap">
          <div class="zd-tag">intent__misc_info <span class="tag-x">×</span></div>
          <div class="zd-tag">language__fr <span class="tag-x">×</span></div>
          <div class="zd-tag">sentiment__neutral <span class="tag-x">×</span></div>
        </div>
      </div>
      <!-- Macro footer — sticky at bottom of sidebar -->
      <div class="zd-macro-footer">
        <div style="position:relative">
          <button class="zd-macro-btn" id="macro-btn" onclick="toggleMacroDropdown()">
            <span class="macro-icon">⚡</span>
            <span id="macro-btn-label">${L==='fr'?'Appliquer une macro':'Apply macro'}</span>
            <span class="macro-arr">▴</span>
          </button>
          <div class="zd-macro-dropdown" id="macro-dropdown">
            <div class="zd-macro-search">
              <input type="text" id="macro-search-input" placeholder="${L==='fr'?'Rechercher une macro...':'Search for a macro...'}" oninput="filterMacros(this.value)" autocomplete="off">
            </div>
            ${macros.map((m,i)=>`<div class="zd-macro-item" id="macro-item-${i}" onclick="simMacroSelect('${m.name}', ${i})">${m.icon} ${m.name}</div>`).join('')}
            <div class="zd-macro-create" onclick="simAction('create-macro')">${L==='fr'?'+ Créer une macro':'+ Create a macro'}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- CENTER CONVERSATION -->
    <div class="zd-conversation">
      <div class="zd-conv-header">
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px">
          <h3 style="margin-bottom:0;flex:1">${s.subject}</h3>
          <div style="position:relative;display:flex;gap:2px;flex-shrink:0">
            <div style="width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#68737D;font-size:14px" onclick="simAction('ai-summary')" title="Summary">≡</div>
            <div style="width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#68737D;font-size:14px" title="Filter">⌿</div>
            <div style="width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#68737D;font-size:13px" title="History">⟳</div>
            <div id="dot-menu-btn" style="width:26px;height:26px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#2F3941;font-size:16px;font-weight:700" onclick="toggleDotMenu()" title="More actions">⋮</div>
            <div id="dot-menu" style="display:none;position:absolute;right:0;top:100%;background:white;border:1px solid #D8DCDE;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:200px;z-index:20;overflow:hidden;margin-top:4px">
              <div style="padding:8px 14px;font-size:12px;color:#2F3941;cursor:pointer;border-bottom:1px solid #F3F4F6" onclick="simAction('create-macro')" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''">Create as macro</div>
              <div style="padding:8px 14px;font-size:12px;color:#2F3941;cursor:pointer;border-bottom:1px solid #F3F4F6" onclick="simAction('merge-ticket')" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''">Merge into another ticket</div>
              <div style="padding:8px 14px;font-size:12px;color:#2F3941;cursor:pointer;border-bottom:1px solid #D8DCDE" onclick="simAction('print-ticket')" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''">Print ticket</div>
              <div style="padding:8px 14px;font-size:12px;color:#CC3340;cursor:pointer;border-bottom:1px solid #F3F4F6;font-weight:500" onclick="simAction('suspend-user')" onmouseover="this.style.background='#FFF5F5'" onmouseout="this.style.background=''">Suspend user</div>
              <div id="mark-spam-opt" style="padding:8px 14px;font-size:12px;color:#CC3340;cursor:pointer;border-bottom:1px solid #F3F4F6;font-weight:500" onclick="simAction('mark-spam')" onmouseover="this.style.background='#FFF5F5'" onmouseout="this.style.background=''">Mark as spam</div>
              <div style="padding:8px 14px;font-size:12px;color:#CC3340;cursor:pointer;font-weight:500" onclick="simAction('delete-ticket')" onmouseover="this.style.background='#FFF5F5'" onmouseout="this.style.background=''">Delete</div>
            </div>
          </div>
        </div>
        <div class="zd-conv-meta">
          <span>${s.via}</span>
          <span class="meta-sep">|</span>
          <span>${L==='fr'?'Sujet':'Topic'}</span>
          <span class="meta-tag">${s.topic}</span>
          <span class="meta-sep">|</span>
          <span class="sentiment">🟡 ${s.sentiment}</span>
        </div>
        <div class="zd-ai-summary-btn" id="ai-summary-btn" onclick="simAction('ai-summary')">
          🤖 ${L==='fr'?'Voir le résumé IA':'View AI summary'}
        </div>
      </div>
      <div class="zd-messages" id="zd-messages">
        ${messages.map(m=>`
          <div class="zd-message ${m.internal?'internal':''}">
            <div class="zd-msg-avatar" style="background:${m.internal?'#F59E0B':'#1F73B7'}">${m.author[0].toUpperCase()}</div>
            <div class="zd-msg-body">
              <div class="zd-msg-header">
                <span class="zd-msg-author">${m.author}</span>
                ${m.internal?`<span class="zd-msg-badge internal">${L==='fr'?'Interne':'Internal'}</span>`:''}
                <span class="zd-msg-time">${m.time}</span>
              </div>
              <div class="zd-msg-bubble">${m.text.replace(/\n/g,'<br>')}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <!-- Composer -->
      <div class="zd-composer" id="zd-composer">
        <div class="zd-composer-mode">
          <div style="position:relative">
            <button class="zd-mode-btn ${s.composerMode==='internal'?'internal-mode':''}" id="mode-btn" onclick="simToggleModeMenu()">
              <span id="mode-icon">${s.composerMode==='internal'?'🔒':'↩'}</span>
              <span id="mode-label">${s.composerMode==='internal'?(L==='fr'?'Note interne':'Internal note'):(L==='fr'?'Réponse publique':'Public reply')}</span>
              <span class="mode-arr">▾</span>
            </button>
            <div id="mode-dropdown" style="display:none;position:absolute;left:0;bottom:calc(100% + 4px);background:white;border:1px solid #D8DCDE;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);min-width:200px;z-index:30;overflow:hidden">
              <div style="padding:9px 14px;font-size:12px;color:#49545C;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid #F3F4F6" onclick="simSelectMode('call')" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''"><span style="font-size:14px">📞</span><div><div style="font-weight:500">${L==='fr'?'Appel':'Call'}</div><div style="font-size:10px;color:#87929D">${L==='fr'?'Entrez un numéro':'Enter a number'}</div></div></div>
              <div style="padding:9px 14px;font-size:12px;color:#49545C;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid #F3F4F6" onclick="simSelectMode('email')" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''"><span style="font-size:14px">✉️</span><span style="font-weight:500">Email</span></div>
              <div style="padding:9px 14px;font-size:12px;color:#49545C;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid #F3F4F6;${s.composerMode!=='internal'?'background:#F0F7FF':''}" onclick="simSelectMode('public')" onmouseover="this.style.background='#EBF5FB'" onmouseout="this.style.background='${s.composerMode!=='internal'?'#F0F7FF':''}'"><span style="font-size:11px;color:#1F73B7;min-width:12px">${s.composerMode!=='internal'?'✓':''}</span><span style="font-size:14px">💬</span><span style="font-weight:500">${L==='fr'?'Réponse publique':'Public reply'}</span></div>
              <div id="internal-note-opt" style="padding:9px 14px;font-size:12px;color:#49545C;cursor:pointer;display:flex;align-items:center;gap:10px;background:#FFF7ED" onclick="simSelectMode('internal')" onmouseover="this.style.background='#FEF3C7'" onmouseout="this.style.background='#FFF7ED'"><span style="font-size:11px;color:#1F73B7;min-width:12px">${s.composerMode==='internal'?'✓':''}</span><span style="font-size:14px">📝</span><span style="font-weight:500">${L==='fr'?'Note interne':'Internal note'}</span></div>
            </div>
          </div>
          <div class="zd-mode-to">
            <span>${L==='fr'?'À :':'To:'}</span>
            <span style="color:#1F73B7">${s.requester.toLowerCase().replace(' ','')}</span>
            <span style="color:#87929D">✏️</span>
            <span class="zd-mode-cc">CC</span>
          </div>
        </div>
        <textarea id="zd-reply-area" class="${s.composerMode==='internal'?'internal-bg':''}"
          placeholder="${s.composerMode==='internal'?(L==='fr'?'Écrivez une note interne (visible uniquement par l\'équipe)...':'Write an internal note (only visible to the team)...'):(L==='fr'?'Écrivez votre réponse...':'Write your reply...')}"></textarea>
        <div class="zd-composer-toolbar">
          <div class="zd-toolbar-btn" title="Gras">B</div>
          <div class="zd-toolbar-btn" title="Italique"><i>I</i></div>
          <div class="zd-toolbar-btn">😊</div>
          <div class="zd-toolbar-btn">📎</div>
          <div class="zd-toolbar-btn">🔗</div>
          <div class="zd-toolbar-btn">✨</div>
        </div>
        <div class="zd-submit-row">
          <span class="zd-close-tab">${L==='fr'?'Fermer l\'onglet':'Close tab'}</span>
          <div class="zd-submit-group" style="position:relative">
            <button class="zd-submit-main" id="submit-main" onclick="simAction('submit')">${submitLabel}</button>
            <button class="zd-submit-arr" id="submit-arr" onclick="toggleSubmitDropdown()">▾</button>
            <div class="zd-submit-dropdown" id="submit-dropdown">
              <div class="zd-submit-opt" onclick="simSubmitAs('open')">
                <span class="zd-status-pill sp-open" style="font-size:10px">Open</span>
                <span class="opt-status">${L==='fr'?'Soumettre comme Ouvert':'Submit as Open'}</span>
              </div>
              <div class="zd-submit-opt" onclick="simSubmitAs('pending')">
                <span class="zd-status-pill sp-pending" style="font-size:10px">Pending</span>
                <span class="opt-status">${L==='fr'?'Soumettre comme En attente':'Submit as Pending'}</span>
              </div>
              <div class="zd-submit-opt" onclick="simSubmitAs('solved')">
                <span class="zd-status-pill sp-solved" style="font-size:10px">Solved</span>
                <span class="opt-status">${L==='fr'?'Soumettre comme Résolu':'Submit as Solved'}</span>
              </div>
              <div class="zd-submit-opt" onclick="simSubmitAs('hold')">
                <span class="zd-status-pill sp-hold" style="font-size:10px">On-hold</span>
                <span class="opt-status">${L==='fr'?'Soumettre comme En pause':'Submit as On-hold'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RIGHT USER PANEL -->
    <div class="zd-user-panel">
      <div class="zd-user-header">
        <div class="zd-user-avatar">${s.requester[0].toUpperCase()}</div>
        <div>
          <div class="zd-user-name" id="user-name-link" onclick="simAction('view-user')">${s.requester.toLowerCase().replace(' ','')}</div>
        </div>
        <div class="zd-user-icons">
          <div class="zd-user-icon">↗️</div>
          <div class="zd-user-icon">▾</div>
        </div>
      </div>
      <div class="zd-user-fields">
        <div class="zd-user-row">
          <div class="zd-user-field-label">Email</div>
          <div class="zd-user-field-val"><a href="#">${s.requesterEmail}</a></div>
        </div>
        <div class="zd-user-row">
          <div class="zd-user-field-label">${L==='fr'?'Heure locale':'Local time'}</div>
          <div class="zd-user-field-val">Mon, 23:14 GMT+2</div>
        </div>
        <div class="zd-user-row">
          <div class="zd-user-field-label">${L==='fr'?'Langue':'Language'}</div>
          <div class="zd-user-field-val">${L==='fr'?'Français':'French'}</div>
        </div>
        <div class="zd-user-row">
          <div class="zd-user-field-label">Notes</div>
          <div class="zd-user-notes">${L==='fr'?'Ajouter une note...':'Add a note...'}</div>
        </div>
      </div>
      <div class="zd-interaction-history">
        <div class="zd-ih-header">
          <span>${L==='fr'?'Historique':'Interaction history'}</span>
          <span style="cursor:pointer">🔄</span>
        </div>
        <div class="zd-ih-ticket">
          <div class="ih-subject">${s.subject}</div>
          <div class="ih-meta">Oct 01 10:37</div>
          <div class="ih-meta">${L==='fr'?'Statut':'Status'} <span class="zd-status-pill sp-${s.status}" id="ih-status-pill" style="font-size:10px">${statusMap[s.status]||'Pending'}</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ── VIEWS SCENE ── */
function renderViewsScene(setup, L) {
  const s = Object.assign({
    activeView: L==='fr'?'Vos tickets non résolus':'Your unsolved tickets',
    tickets: []
  }, setup);

  const defaultTickets = [
    { id:'#1201', status:'open',    subject: L==='fr'?'Mon produit ne démarre plus':'My product won\'t start anymore', requester:'Marie Martin',  date:'Jul 31', type:'Ticket',   priority:L==='fr'?'Normal':'Normal',  sla:{label:'42m',  st:'ok'} },
    { id:'#1198', status:'open',    subject: L==='fr'?'Problème de connexion':'Connection issue',                      requester:'Jean Dupont',   date:'Jul 30', type:'Ticket',   priority:L==='fr'?'Haute':'High',     sla:{label:'2m',   st:'warning'} },
    { id:'#1185', status:'open',    subject: L==='fr'?'Demande de remboursement':'Refund request',                     requester:'Sophie Blanc',  date:'Jul 30', type:'Ticket',   priority:L==='fr'?'Urgente':'Urgent', sla:{label:'-3h',  st:'breach'} },
    { id:'#1172', status:'pending', subject: L==='fr'?'Délai de livraison estimé ?':'Estimated delivery time?',       requester:'Paul Durand',   date:'Jul 29', type:'Question', priority:L==='fr'?'Normal':'Normal',  sla:{label:L==='fr'?'Suspendu':'Paused', st:'paused'} },
    { id:'#1143', status:'open',    subject: L==='fr'?'Erreur lors de l\'installation':'Error during installation',   requester:'Claire Lambert', date:'Jul 28', type:'Incident', priority:L==='fr'?'Haute':'High',     sla:{label:'-11h', st:'breach'} },
  ];
  const tickets = s.tickets.length ? s.tickets : defaultTickets;

  return `
  ${renderGlobalTopBar({})}
  <div class="zd-views-layout">
    <!-- VIEWS SIDEBAR -->
    <div class="zd-views-sidebar">
      <div class="zd-views-header">
        <span>${L==='fr'?'Vues':'Views'}</span>
        <div class="zd-views-header-btns"><span>+</span><span>🔄</span></div>
      </div>
      <div class="zd-views-group">
        <div class="zd-views-group-title"><span>${L==='fr'?'Partagées':'Shared'}</span><span>313</span></div>
        <div class="zd-view-item active" id="view-unsolved">
          <span class="view-dot">👋</span>
          <span>${L==='fr'?'Vos tickets non résolus':'Your unsolved tickets'}</span>
          <span class="view-count">29</span>
        </div>
        <div class="zd-view-item" id="view-all">
          <span class="view-dot" style="color:#CC3340">●</span>
          <span>${L==='fr'?'Tous non résolus':'All unsolved tickets'}</span>
          <span class="view-count">219</span>
        </div>
        <div class="zd-view-item" id="view-new">
          <span class="view-dot" style="color:#F79A3E">●</span>
          <span>${L==='fr'?'Nouveaux tickets groupe':'New tickets in groups'}</span>
          <span class="view-count">8</span>
        </div>
        <div class="zd-view-item" id="view-pending">
          <span class="view-dot" style="color:#F79A3E">●</span>
          <span>${L==='fr'?'Tickets en attente':'Pending tickets'}</span>
          <span class="view-count">4</span>
        </div>
        <div class="zd-view-item" id="view-solved">
          <span class="view-dot" style="color:#568A42">●</span>
          <span>${L==='fr'?'Récemment résolus':'Recently solved'}</span>
          <span class="view-count">0</span>
        </div>
      </div>
      <div class="zd-views-divider"></div>
      <div class="zd-views-group">
        <div class="zd-views-group-title"><span>${L==='fr'?'Personnelles':'Personal'}</span><span>30</span></div>
        <div class="zd-view-item" id="view-personal-1">
          <span class="view-dot" style="color:#8B5CF6">✦</span>
          <span>AI chat assignment</span>
          <span class="view-count">30</span>
        </div>
        <div class="zd-view-item" id="view-personal-2" onclick="simAction('view-personal')">
          <span class="view-dot" style="color:#8B5CF6">✦</span>
          <span>AI agent</span>
          <span class="view-count">0</span>
        </div>
      </div>
      <div class="zd-views-divider"></div>
      <div class="zd-view-item" id="view-suspended" style="color:#87929D">
        <span>${L==='fr'?'Tickets suspendus':'Suspended tickets'}</span><span class="view-count">0</span>
      </div>
      <div class="zd-view-item" id="view-deleted" style="color:#87929D">
        <span>${L==='fr'?'Tickets supprimés':'Deleted tickets'}</span><span class="view-count">0</span>
      </div>
      <div class="zd-views-link">
        <span onclick="simAction('manage-views')">🔗 ${L==='fr'?'Gérer les vues':'Manage views'}</span>
      </div>
    </div>

    <!-- VIEWS MAIN -->
    <div class="zd-views-main">
      <div class="zd-views-top">
        <h3>👋 ${s.activeView}</h3>
        <div class="zd-views-actions">
          <button class="zd-actions-btn">${L==='fr'?'Actions':'Actions'} ▾</button>
          <button class="zd-play-btn" id="play-btn" onclick="simAction('play')">
            <span class="play-icon">▶</span> Play
          </button>
        </div>
      </div>
      <div class="zd-views-filter-bar">
        <button class="zd-filter-btn">🔍 ${L==='fr'?'Filtrer':'Filter'}</button>
        <span class="zd-ticket-count">${tickets.length} tickets</span>
        <span class="zd-last-updated">· ${L==='fr'?'Mis à jour à l\'instant':'Last updated just now'}</span>
      </div>
      <div class="zd-ticket-table">
        <div class="zd-table-head">
          <div></div>
          <div class="zd-th">${L==='fr'?'Statut':'Ticket status'} ↕</div>
          <div class="zd-th">${L==='fr'?'Sujet':'Subject'} ↕</div>
          <div class="zd-th">${L==='fr'?'Demandeur':'Requester'} ↕</div>
          <div class="zd-th">${L==='fr'?'Date':'Requested'} ↕</div>
          <div class="zd-th">Type</div>
          <div class="zd-th">${L==='fr'?'Priorité':'Priority'}</div>
          <div class="zd-th">SLA ↕</div>
          <div></div>
        </div>
        <div class="zd-status-group"><span class="zd-status-group-label">${L==='fr'?'Catégorie de statut: Ouvert':'Status category: Open'}</span></div>
        ${tickets.map((t,i)=>`
          <div class="zd-ticket-row" id="trow-${i}" onclick="simAction('open-ticket-${i}')">
            <input type="checkbox">
            <div><span class="zd-status-pill sp-${t.status}">${t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span></div>
            <div class="zd-ticket-subject">${t.subject}</div>
            <div class="zd-ticket-requester">${t.requester}</div>
            <div class="zd-ticket-date">${t.date}</div>
            <div class="zd-ticket-type">${t.type}</div>
            <div class="zd-ticket-priority">${t.priority}</div>
            <div class="zd-ticket-sla ${t.sla?'sla-'+t.sla.st:''}">${t.sla?t.sla.label:''}</div>
            <div class="zd-ticket-menu">⋮</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

/* ── AGENT HOME SCENE ── */
function renderAgentHomeScene(setup, L) {
  const s = Object.assign({ activeNav:'tickets', tickets:[] }, setup);
  const defaultTickets = [
    { name:'Stephanie', status:'open', sla:'-250d', subject: L==='fr'?'Conversation avec Stephanie':'Conversation with Stephanie', meta:'Dec 17 16:40 | #172' },
    { name:'Stephanie', status:'open', sla:'-237d', subject:'hola', meta:'Dec 30 13:40 | #206' },
    { name:'Web User', status:'open', sla:'-237d', subject:L==='fr'?'Comment passer une commande ?':'how can I place an order?', meta:'Dec 30 13:57 | #208' },
    { name:'Web User', status:'open', sla:'-234d', subject:L==='fr'?'Un instant pendant que je vérifie':'Just a moment while I check', meta:'Jan 02 19:35 | #239' },
  ];
  const tickets = s.tickets.length ? s.tickets : defaultTickets;
  return `
  ${renderGlobalTopBar({})}
  <div class="zd-home-layout">
    <!-- HOME SIDEBAR -->
    <div class="zd-home-sidebar">
      <div class="zd-home-section">
        <div class="zd-home-nav-item active" id="home-nav-home" onclick="simAction('nav-home')">
          <span class="nav-icon">🏠</span> Home
        </div>
      </div>
      <div class="zd-home-section">
        <div class="zd-home-section-title">${L==='fr'?'Mon travail':'Your work'}</div>
        <div class="zd-home-nav-item active" id="home-nav-tickets" onclick="simAction('nav-tickets')" style="font-weight:700;background:#EBF5FB;color:#1F73B7;">
          <span class="nav-icon">🎫</span> ${L==='fr'?'Tickets':'Tickets'}
        </div>
      </div>
      <div class="zd-home-section">
        <div class="zd-home-section-title">${L==='fr'?'Travail partagé':'Shared work'}</div>
        <div class="zd-home-nav-item" id="home-nav-cc" onclick="simAction('nav-cc')">
          <span class="nav-icon">👥</span> CC'd
        </div>
        <div class="zd-home-nav-item" id="home-nav-following" onclick="simAction('nav-following')">
          <span class="nav-icon">👁️</span> Following
        </div>
      </div>
      <div class="zd-home-section">
        <div class="zd-home-section-title">${L==='fr'?'Travail terminé':'Completed work'}</div>
        <div class="zd-home-nav-item" id="home-nav-last30" onclick="simAction('nav-last30')">
          <span class="nav-icon">📅</span> ${L==='fr'?'30 derniers jours':'Last 30 days'}
        </div>
      </div>
    </div>

    <!-- HOME MAIN -->
    <div class="zd-home-main">
      <div class="zd-home-top">
        <span class="ticket-count">29 ${L==='fr'?'tickets':'tickets'}</span>
        <div class="zd-home-filters">
          <div class="zd-home-filter">${L==='fr'?'Statut':'Status'} 🔽</div>
          <div class="zd-home-filter">${L==='fr'?'Canal':'Channel'} 🔽</div>
          <div class="zd-home-filter">${L==='fr'?'Recommandé':'Recommended'} ⬆</div>
        </div>
      </div>
      ${tickets.map((t,i)=>`
        <div class="zd-home-ticket" id="home-trow-${i}" onclick="simAction('open-home-ticket-${i}')">
          <span class="ht-icon">💬</span>
          <div class="zd-home-ticket-info">
            <div class="zd-ht-top">
              <span class="zd-ht-name">${t.name}</span>
              <span class="zd-ht-status ${t.status}"></span>
              <span>${L==='fr'?'Ouvert':'Open'}</span>
              <span class="zd-ht-sla">${t.sla}</span>
            </div>
            <div class="zd-ht-subject">${t.subject}</div>
            <div class="zd-ht-meta">${t.meta}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- HOME RIGHT STATS -->
    <div class="zd-home-stats">
      <div class="zd-stats-section">
        <div class="zd-stats-title">${L==='fr'?'Statistiques tickets':'Ticket statistics'}</div>
        <div class="zd-stats-sub">${L==='fr'?'Cette semaine':'This week'}</div>
        <div class="zd-stats-row">
          <div class="zd-stat-item"><div class="zd-stat-num" style="color:#568A42">0</div><div class="zd-stat-label">${L==='fr'?'Positif':'Good'}</div></div>
          <div class="zd-stat-item"><div class="zd-stat-num" style="color:#CC3340">0</div><div class="zd-stat-label">${L==='fr'?'Négatif':'Bad'}</div></div>
          <div class="zd-stat-item"><div class="zd-stat-num" style="color:#1F73B7">0</div><div class="zd-stat-label">${L==='fr'?'Résolus':'Solved'}</div></div>
        </div>
      </div>
      <div class="zd-stat-divider"></div>
      <div class="zd-stats-section">
        <div class="zd-stats-title">${L==='fr'?'Satisfaction':'Satisfaction statistics'}</div>
        <div class="zd-stats-sub">60 ${L==='fr'?'jours':'days'}</div>
        <div class="zd-stats-row">
          <div class="zd-stat-item"><div class="zd-stat-num" style="color:#87929D">-</div><div class="zd-stat-label">${L==='fr'?'Vous':'You'}</div></div>
          <div class="zd-stat-item"><div class="zd-stat-num">0%</div><div class="zd-stat-label">Help Desk</div></div>
        </div>
      </div>
      <div class="zd-stat-divider"></div>
      <div class="zd-stats-section">
        <div class="zd-stats-title">${L==='fr'?'Tickets ouverts':'Open tickets'}</div>
        <div class="zd-open-count">52</div>
        <div class="zd-open-label">${L==='fr'?'Vos groupes':'Your groups'}</div>
      </div>
      <div class="zd-stat-divider"></div>
      <div class="zd-updates-title">${L==='fr'?'Mises à jour':'Updates'}</div>
      <div class="zd-update-item">Zendesk ${L==='fr'?'a commenté sur':'commented on'} Conversation #208</div>
      <div class="zd-update-date">Jul 31 12:07</div>
      <div class="zd-update-item" style="margin-top:6px">Zendesk ${L==='fr'?'vous a assigné':'assigned you'} Conversation #6a6c...</div>
      <div class="zd-update-date">Jul 31 11:57</div>
    </div>
  </div>`;
}

/* ── RENDER EXERCISE ── */
function renderNewTicketScene(setup, L) {
  const fr = L === 'fr';
  return `
  <div style="font-family:-apple-system,sans-serif;font-size:12px;background:#F3F4F6;border-radius:4px;overflow:hidden">
    <div style="background:#1F73B7;color:white;padding:6px 12px;display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="background:rgba(255,255,255,0.2);border-radius:4px;padding:2px 8px;font-weight:700">Z</span>
      <span style="opacity:0.85">Support ▾</span>
      <span style="background:rgba(255,255,255,0.15);border-radius:4px;padding:2px 8px;font-size:11px">+ Add</span>
      <span style="background:rgba(255,255,255,0.1);border-radius:4px;padding:2px 10px;font-size:11px;opacity:0.9">&#128196; ${fr?'Nouveau ticket':'New ticket'}</span>
      <span style="margin-left:auto;opacity:0.7;font-size:11px">&#128269; &nbsp; S &nbsp; Next →</span>
    </div>
    <div style="display:grid;grid-template-columns:170px 1fr 180px;min-height:320px">
      <div style="background:#F8F9F9;border-right:1px solid #D8DCDE;padding:10px 12px;display:flex;flex-direction:column;gap:8px">
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">BRAND</div>
          <div style="border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#49545C;font-size:11px">&#128230; OmyCare</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">${fr?'DEMANDEUR':'REQUESTER'} <span style="color:#CC3340">*</span></div>
          <input id="nt-requester" style="width:100%;box-sizing:border-box;border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#2F3941;font-size:11px;outline:none" placeholder="${fr?'Nom ou email du client...':'Customer name or email...'}" oninput="simNtCheck()">
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">${fr?'ASSIGNÉ':'ASSIGNEE'}</div>
          <div style="border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#49545C;font-size:11px">Support / Marie</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">TYPE</div>
          <div style="border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#87929D;font-size:11px">-</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">${fr?'PRIORITÉ':'PRIORITY'}</div>
          <div style="border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#49545C;font-size:11px">${fr?'Normale':'Normal'}</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">TAGS</div>
          <div style="border:1px solid #D8DCDE;border-radius:4px;padding:4px 7px;background:white;color:#87929D;font-size:11px;min-height:18px"></div>
        </div>
      </div>
      <div style="background:white;display:flex;flex-direction:column">
        <div style="border-bottom:1px solid #D8DCDE;padding:10px 14px">
          <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:4px">${fr?'SUJET':'SUBJECT'} <span style="color:#CC3340">*</span></div>
          <input id="nt-subject" style="width:100%;box-sizing:border-box;border:none;outline:none;font-size:15px;font-weight:600;color:#2F3941" placeholder="${fr?'Résumé de la demande...':'Brief summary...'}" oninput="simNtCheck()">
        </div>
        <div style="border-bottom:1px solid #D8DCDE;padding:8px 14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:20px;padding:3px 10px;font-size:11px;color:#49545C">↩ ${fr?'Réponse publique':'Public reply'} ▾</span>
          </div>
          <textarea id="nt-body" style="width:100%;box-sizing:border-box;border:none;outline:none;font-size:12px;color:#2F3941;resize:none;min-height:80px;font-family:inherit" placeholder="${fr?'Rédigez votre message au client...':'Write your message to the customer...'}" oninput="simNtCheck()"></textarea>
          <div style="display:flex;gap:8px;color:#87929D;font-size:13px;margin-top:4px"><span>B</span><span style="font-style:italic">I</span><span>&#128522;</span><span>&#128206;</span><span>&#128279;</span></div>
        </div>
        <div style="padding:8px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:11px;color:#68737D">${fr?'Fermer onglet':'Close tab'}</span>
          <div style="position:relative">
            <div id="nt-dropdown" style="display:none;position:absolute;bottom:100%;right:0;background:white;border:1px solid #D8DCDE;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.15);min-width:190px;z-index:10;margin-bottom:4px">
              <div onclick="simSubmitNewTicket('pending')" style="padding:8px 12px;font-size:12px;color:#2F3941;cursor:pointer;display:flex;align-items:center;gap:8px;border-bottom:1px solid #F3F4F6" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''"><span class="zd-status-pill sp-pending" style="font-size:10px">Pending</span>${fr?'Soumettre comme En attente':'Submit as Pending'}</div>
              <div onclick="simSubmitNewTicket('new')" style="padding:8px 12px;font-size:12px;color:#2F3941;cursor:pointer;display:flex;align-items:center;gap:8px" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background=''"><span class="zd-status-pill sp-new" style="font-size:10px">${fr?'Nouveau':'New'}</span>${fr?'Soumettre comme Nouveau':'Submit as New'}</div>
            </div>
            <div style="display:flex">
              <button id="nt-submit-btn" onclick="simSubmitNewTicket('new')" disabled style="background:#C8D0D6;color:white;border:none;border-radius:4px 0 0 4px;padding:5px 14px;font-size:12px;font-weight:600;cursor:not-allowed;transition:background .2s">${fr?'Soumettre comme Nouveau':'Submit as New'}</button>
              <button id="nt-submit-arr" onclick="simNtToggleDropdown()" disabled style="background:#C8D0D6;color:white;border:none;border-radius:0 4px 4px 0;padding:5px 8px;font-size:12px;cursor:not-allowed;border-left:1px solid rgba(255,255,255,.25);transition:background .2s">▾</button>
            </div>
          </div>
        </div>
      </div>
      <div style="background:white;border-left:1px solid #D8DCDE;padding:10px 12px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:34px;height:34px;border-radius:50%;background:#C8D0D6;display:flex;align-items:center;justify-content:center;color:#68737D;font-weight:700;font-size:14px">?</div>
          <div style="color:#87929D;font-size:11px;font-style:italic">${fr?'(demandeur)':'(requester)'}</div>
        </div>
        <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase">EMAIL</div>
        <div style="color:#C8D0D6;font-size:11px">—</div>
        <div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-top:4px">NOTES</div>
        <div style="border:1px solid #D8DCDE;border-radius:4px;padding:5px 7px;color:#87929D;font-size:11px;min-height:36px">${fr?'Ajouter une note...':'Add a note...'}</div>
      </div>
    </div>
  </div>`;
}

function simNtCheck() {
  const req = document.getElementById('nt-requester');
  const sub = document.getElementById('nt-subject');
  const btn = document.getElementById('nt-submit-btn');
  const arr = document.getElementById('nt-submit-arr');
  if (!req || !sub || !btn) return;
  const filled = req.value.trim().length > 0 && sub.value.trim().length > 0;
  [btn, arr].forEach(el => { if (!el) return;
    el.disabled = !filled;
    el.style.background = filled ? '#2F3941' : '#C8D0D6';
    el.style.cursor = filled ? 'pointer' : 'not-allowed';
  });
}

function simNtToggleDropdown() {
  const dd = document.getElementById('nt-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function simSubmitNewTicket(status) {
  const dd = document.getElementById('nt-dropdown');
  if (dd) dd.style.display = 'none';
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  const req = document.getElementById('nt-requester');
  const sub = document.getElementById('nt-subject');
  const body = document.getElementById('nt-body');
  const reqVal = req ? req.value.trim() : '';
  const subVal = sub ? sub.value.trim() : '';
  const bodyVal = body ? body.value.trim() : '';

  // If any required field is empty, do nothing (buttons should be disabled anyway)
  if (!reqVal || !subVal || !bodyVal) return;

  if (status === 'pending' || status === 'solved') {
    _simHandleResult(true, ex);
  } else {
    // Wrong status — show feedback but allow retry (don't lock)
    const L = window._simL;
    const fb = document.getElementById('sim-feedback');
    fb.className = 'sim-feedback-banner show ko';
    fb.innerHTML = '❌ ' + ex.feedback.wrong[L];
  }
}


// ── PROBLEM-INCIDENT SCENE ──────────────────────────────────────────────────

function renderProblemIncidentScene(setup, L) {
  window._simPhase = 1;
  window._simPiLinked = false;
  return getPiPhaseHtml(1, L === 'fr');
}

function simPiStepBar(phase, fr) {
  const labels = fr
    ? ['Créer Problème', 'Incident #4521', 'Incident #4532', 'Résoudre']
    : ['Create Problem', 'Incident #4521', 'Incident #4532', 'Solve'];
  let html = '<div style="display:flex;align-items:center;padding:10px 16px;background:#F8F9FA;border-bottom:1px solid #D8DCDE;gap:0">';
  labels.forEach((lbl, i) => {
    const n = i + 1;
    const done = n < phase, active = n === phase;
    const bg = done ? '#10B981' : active ? '#1F73B7' : '#D8DCDE';
    const tc = done || active ? 'white' : '#9CA3AF';
    html += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1"><div style="width:20px;height:20px;border-radius:50%;background:${bg};color:${tc};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">${done ? '✓' : n}</div><div style="font-size:9px;color:${active ? '#1F73B7' : done ? '#10B981' : '#9CA3AF'};font-weight:${active ? '700' : '400'};text-align:center;white-space:nowrap">${lbl}</div></div>`;
    if (i < labels.length - 1) html += `<div style="height:2px;flex:0 0 20px;background:${done ? '#10B981' : '#D8DCDE'};margin-bottom:14px"></div>`;
  });
  return html + '</div>';
}

function getPiPhaseHtml(phase, fr) {
  const topbar = renderGlobalTopBar({ tabs: [{ icon: '📄', title: fr ? 'Nouveau ticket' : 'New ticket' }] });
  const sb = simPiStepBar(phase, fr);

  if (phase === 1) {
    return topbar + sb + `<div style="display:grid;grid-template-columns:180px 1fr;min-height:300px"><div style="border-right:1px solid #D8DCDE;padding:14px;font-size:12px"><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">BRAND</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px">OmyCare</div></div><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">REQUESTER</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px">Marie Dupont</div></div><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">TYPE <span style="color:#CC3340">*</span></div><select id="pi-type-1" onchange="simPiTypeChange(1)" style="width:100%;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px;font-size:12px;background:white;user-select:text;pointer-events:auto"><option value="">-</option><option value="question">${fr ? 'Question' : 'Question'}</option><option value="incident">${fr ? 'Incident' : 'Incident'}</option><option value="problem">${fr ? 'Problème' : 'Problem'}</option><option value="task">${fr ? 'Tâche' : 'Task'}</option></select></div><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">PRIORITY</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px">Normal</div></div></div><div style="padding:14px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:4px">SUBJECT</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:8px;font-size:13px;font-weight:600;margin-bottom:12px">${fr ? 'Crash de l\'app au login — plusieurs clients affectés' : 'App crash on login — multiple customers affected'}</div><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:4px">DESCRIPTION</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:8px;font-size:12px;color:#68737D;min-height:60px">${fr ? 'Plusieurs clients signalent une erreur critique au login depuis ce matin.' : 'Multiple customers are reporting a critical login error since this morning.'}</div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button id="pi-btn-1" onclick="simPiPhase1Submit()" disabled style="background:#C8D0D6;color:white;border:none;border-radius:4px;padding:6px 16px;font-size:12px;font-weight:600;cursor:not-allowed;transition:background .2s">${fr ? 'Soumettre comme Problème' : 'Submit as Problem'}</button></div></div></div>`;
  }

  if (phase === 2 || phase === 3) {
    const num = phase === 2 ? '4521' : '4532';
    const name = phase === 2 ? 'Sophie Martin' : 'Paul Durand';
    const subj = phase === 2 ? (fr ? 'Impossible de me connecter' : "Can't log in") : (fr ? 'Erreur de connexion depuis ce matin' : 'Login error since this morning');
    const msg = phase === 2
      ? (fr ? 'Bonjour, je n\'arrive pas à me connecter à l\'application depuis ce matin. Pouvez-vous m\'aider ?' : 'Hello, I cannot log in to the app since this morning. Can you help me?')
      : (fr ? 'Bonsoir, j\'ai une erreur de connexion depuis 8h ce matin. Mon équipe est aussi bloquée.' : 'Hi, I have been getting a login error since 8am. My whole team is blocked too.');
    return topbar + sb + `<div style="padding:12px 16px;border-bottom:1px solid #D8DCDE;display:flex;align-items:center;gap:10px;background:white"><div style="width:28px;height:28px;border-radius:50%;background:#D8DCDE;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#68737D;flex-shrink:0">${name[0]}</div><div><div style="font-size:13px;font-weight:600">${subj}</div><div style="font-size:11px;color:#68737D">#${num} · ${name}</div></div><span class="zd-status-pill sp-open" style="margin-left:auto">Open</span></div><div style="display:grid;grid-template-columns:180px 1fr;min-height:260px"><div style="border-right:1px solid #D8DCDE;padding:14px;font-size:12px"><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">REQUESTER</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px">${name}</div></div><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">TYPE</div><select id="pi-type-${phase}" onchange="simPiTypeChange(${phase})" style="width:100%;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px;font-size:12px;background:white;user-select:text;pointer-events:auto"><option value="question">${fr ? 'Question' : 'Question'}</option><option value="incident">${fr ? 'Incident' : 'Incident'}</option><option value="problem">${fr ? 'Problème' : 'Problem'}</option></select></div><div id="pi-link-wrap-${phase}" style="display:none;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">${fr ? 'PROBLÈME LIÉ' : 'LINKED PROBLEM'}</div><div id="pi-link-search-${phase}" style="border:1px solid #D8DCDE;border-radius:3px;background:white;overflow:hidden"><div style="padding:4px 8px;font-size:11px;color:#68737D;background:#F8F9FA;border-bottom:1px solid #D8DCDE">${fr ? 'Chercher un problème...' : 'Search a problem...'}</div><div onclick="simPiLinkSelect(${phase})" style="padding:6px 8px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:6px" onmouseover="this.style.background='#EFF6FF'" onmouseout="this.style.background=''"><span style="background:#F79A3E;color:white;border-radius:3px;padding:1px 5px;font-size:9px;font-weight:700;white-space:nowrap">${fr ? 'Problème' : 'Problem'}</span><span>${fr ? 'Crash de l\'app (#4500)' : 'App crash on login (#4500)'}</span></div></div><div id="pi-link-selected-${phase}" style="display:none;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:3px;padding:4px 8px;font-size:11px;color:#1E40AF">✓ #4500 ${fr ? 'lié' : 'linked'}</div></div></div><div style="padding:14px"><div style="background:#F3F4F6;border-radius:6px;padding:10px;margin-bottom:12px;font-size:12px;line-height:1.5;color:#2F3941">${msg}</div><div style="display:flex;justify-content:flex-end"><button id="pi-btn-${phase}" onclick="simPiPhaseSubmit(${phase})" disabled style="background:#C8D0D6;color:white;border:none;border-radius:4px;padding:6px 16px;font-size:12px;font-weight:600;cursor:not-allowed;transition:background .2s">${fr ? 'Soumettre comme Incident' : 'Submit as Incident'}</button></div></div></div>`;
  }

  // Phase 4: Problem ticket with linked incidents
  return topbar + sb + `<div style="padding:12px 16px;border-bottom:1px solid #D8DCDE;display:flex;align-items:center;gap:10px;background:white"><div style="width:28px;height:28px;border-radius:50%;background:#FEE2E2;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">🔴</div><div><div style="font-size:13px;font-weight:600">${fr ? 'Crash de l\'app au login — plusieurs clients affectés' : 'App crash on login — multiple customers affected'}</div><div style="font-size:11px;color:#68737D">#4500 · Marie Dupont</div></div><span class="zd-status-pill sp-open" style="margin-left:auto">Open</span></div><div style="display:grid;grid-template-columns:180px 1fr;min-height:260px"><div style="border-right:1px solid #D8DCDE;padding:14px;font-size:12px"><div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:3px">TYPE</div><div style="background:#F3F4F6;border:1px solid #D8DCDE;border-radius:3px;padding:4px 8px;color:#2F3941">🔴 ${fr ? 'Problème' : 'Problem'}</div></div><div><div style="font-size:10px;font-weight:700;color:#68737D;text-transform:uppercase;margin-bottom:6px">${fr ? 'INCIDENTS LIÉS' : 'LINKED INCIDENTS'} <span style="background:#CC3340;color:white;border-radius:10px;padding:1px 6px;font-size:10px;font-weight:700">2</span></div><div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:3px;padding:6px 8px;margin-bottom:4px;font-size:11px"><div style="font-weight:600">#4521 · Sophie Martin</div><div style="color:#68737D">${fr ? 'Impossible de me connecter' : "Can't log in"}</div></div><div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:3px;padding:6px 8px;font-size:11px"><div style="font-weight:600">#4532 · Paul Durand</div><div style="color:#68737D">${fr ? 'Erreur de connexion depuis ce matin' : 'Login error since this morning'}</div></div></div></div><div style="padding:14px"><div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:6px;padding:10px;margin-bottom:16px;font-size:12px;color:#92400E;line-height:1.5">ℹ️ ${fr ? 'Ce ticket Problème est lié à 2 incidents. En le résolvant, les 2 incidents seront automatiquement résolus et les clients notifiés.' : 'This Problem ticket is linked to 2 incidents. Solving it will automatically resolve both incidents and notify the customers.'}</div><div style="display:flex;justify-content:flex-end"><button id="pi-solve-btn" onclick="simPiSolve()" style="background:#10B981;color:white;border:none;border-radius:4px;padding:6px 16px;font-size:12px;font-weight:600;cursor:pointer">✓ ${fr ? 'Soumettre comme Résolu' : 'Submit as Solved'}</button></div></div></div>`;
}

function simPiTypeChange(phase) {
  const sel = document.getElementById('pi-type-' + phase);
  if (!sel) return;
  const val = sel.value;
  if (phase === 1) {
    const btn = document.getElementById('pi-btn-1');
    if (btn) { const ok = val === 'problem'; btn.disabled = !ok; btn.style.background = ok ? '#1F73B7' : '#C8D0D6'; btn.style.cursor = ok ? 'pointer' : 'not-allowed'; }
  } else {
    const linkWrap = document.getElementById('pi-link-wrap-' + phase);
    if (linkWrap) linkWrap.style.display = val === 'incident' ? 'block' : 'none';
    if (val !== 'incident') { window._simPiLinked = false; const ls = document.getElementById('pi-link-selected-' + phase); const lsr = document.getElementById('pi-link-search-' + phase); if (ls) ls.style.display = 'none'; if (lsr) lsr.style.display = 'block'; }
    const btn = document.getElementById('pi-btn-' + phase);
    if (btn) { btn.disabled = true; btn.style.background = '#C8D0D6'; btn.style.cursor = 'not-allowed'; }
  }
}

function simPiLinkSelect(phase) {
  window._simPiLinked = true;
  const ls = document.getElementById('pi-link-search-' + phase);
  const lsel = document.getElementById('pi-link-selected-' + phase);
  if (ls) ls.style.display = 'none';
  if (lsel) lsel.style.display = 'block';
  const btn = document.getElementById('pi-btn-' + phase);
  if (btn) { btn.disabled = false; btn.style.background = '#1F73B7'; btn.style.cursor = 'pointer'; }
}

function simPiPhase1Submit() {
  const sel = document.getElementById('pi-type-1');
  if (!sel || sel.value !== 'problem') return;
  simPiAdvance();
}

function simPiPhaseSubmit(phase) {
  const sel = document.getElementById('pi-type-' + phase);
  if (!sel || sel.value !== 'incident' || !window._simPiLinked) return;
  simPiAdvance();
}

function simPiAdvance() {
  window._simPhase++;
  window._simPiLinked = false;
  const fr = window._simL === 'fr';
  const sim = document.getElementById('zd-sim-area');
  if (sim) sim.innerHTML = getPiPhaseHtml(window._simPhase, fr);
  const instrs = {
    fr: ['', 'Ticket #4521 : changez le Type en Incident et liez-le au Problème #4500.', 'Ticket #4532 : même démarche — Type Incident, lié au Problème #4500.', 'Le Problème #4500 est lié à 2 incidents. Résolvez-le pour les résoudre tous en une fois.'],
    en: ['', 'Ticket #4521: change Type to Incident and link it to Problem #4500.', 'Ticket #4532: same flow — Type Incident, linked to Problem #4500.', 'Problem #4500 is linked to 2 incidents. Solve it to resolve them all at once.']
  };
  const instrEl = document.getElementById('sim-instruction-text');
  if (instrEl && instrs[window._simL][window._simPhase - 1]) instrEl.textContent = instrs[window._simL][window._simPhase - 1];
}

function simPiSolve() {
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  _simHandleResult(true, ex);
}

// ── END PROBLEM-INCIDENT SCENE ──────────────────────────────────────────────

function renderSimExercise(exercise, container, L) {
  window._simExercise = exercise;
  window._simL = L;
  window._simAnswered = false;

  let sceneHtml = '';
  if (exercise.scene === 'ticket') sceneHtml = renderTicketScene(exercise.setup || {}, L);
  else if (exercise.scene === 'views') sceneHtml = renderViewsScene(exercise.setup || {}, L);
  else if (exercise.scene === 'home') sceneHtml = renderAgentHomeScene(exercise.setup || {}, L);
  else if (exercise.scene === 'new-ticket') sceneHtml = renderNewTicketScene(exercise.setup || {}, L);
  else if (exercise.scene === 'problem-incident') sceneHtml = renderProblemIncidentScene(exercise.setup || {}, L);

  container.innerHTML = `
    <div class="sim-wrap" style="margin-top:22px">
      <div class="sim-instruction">
        <span class="pulse-dot"></span>
        <span id="sim-instruction-text">${exercise.instruction[L]}</span>
      </div>
      <div class="zd-sim" id="zd-sim-area">
        ${sceneHtml}
      </div>
      <div class="sim-feedback-banner" id="sim-feedback"></div>
    </div>`;

  // Highlight target elements (skip for new-ticket: user must fill fields first)
  if (exercise.scene !== 'new-ticket') {
    setTimeout(() => highlightTarget(exercise.target), 100);
  }
}

function highlightTarget(target) {
  if (!target || !target.element) return;
  const el = document.getElementById(target.element);
  if (el) el.classList.add('zd-highlight');
}

/* ── ACTION HANDLERS ── */
function simAction(action) {
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;

  const target = ex.target;
  const correct = target.action === action ||
    (target.action === 'click' && target.element && action.includes(target.element));

  // Ignore actions that are UI-only and never a meaningful wrong answer
  const uiOnly = ['ai-summary', 'view-user', 'manage-views', 'view-personal',
                  'nav-home', 'nav-tickets', 'nav-cc', 'nav-following', 'nav-last30',
                  'create-macro', 'merge-ticket', 'print-ticket', 'suspend-user', 'delete-ticket',
                  'call', 'email'];
  if (!correct && uiOnly.includes(action)) return;

  // For submit-as exercises, only the main submit button click is a valid wrong action
  if (!correct && target.action === 'submit-as' && action !== 'submit') return;

  _simHandleResult(correct, ex);
}

function simSelectChange(field, value) {
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  const target = ex.target;
  const correct = target.action === 'select' && target.field === field && target.value === value;
  _simHandleResult(correct, ex);
}

function simToggleModeMenu() {
  const dd = document.getElementById('mode-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function simSelectMode(mode) {
  const dd = document.getElementById('mode-dropdown');
  if (dd) dd.style.display = 'none';
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  const modeBtn = document.getElementById('mode-btn');
  const modeIcon = document.getElementById('mode-icon');
  const modeLabel = document.getElementById('mode-label');
  const textarea = document.getElementById('zd-reply-area');
  const L = window._simL;
  if (mode === 'internal') {
    modeBtn.classList.add('internal-mode');
    modeIcon.textContent = '🔒';
    modeLabel.textContent = L==='fr'?'Note interne':'Internal note';
    if(textarea){ textarea.classList.add('internal-bg'); textarea.placeholder = L==='fr'?'Note interne (visible uniquement par l\'équipe)...':'Internal note (only visible to the team)...'; }
  } else if (mode === 'public') {
    modeBtn.classList.remove('internal-mode');
    modeIcon.textContent = '↩';
    modeLabel.textContent = L==='fr'?'Réponse publique':'Public reply';
    if(textarea){ textarea.classList.remove('internal-bg'); textarea.placeholder = L==='fr'?'Écrivez votre réponse...':'Write your reply...'; }
  }
  const target = ex.target;
  if (target.action === 'switch-mode') {
    _simHandleResult(target.value === mode, ex);
  }
}

function simSubmitAs(status) {
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  document.getElementById('submit-dropdown').classList.remove('open');
  const target = ex.target;
  const correct = target.action === 'submit-as' && target.value === status;
  _simHandleResult(correct, ex);
}

function simMacroSelect(name, idx) {
  const ex = window._simExercise;
  if (!ex || window._simAnswered) return;
  const dd = document.getElementById('macro-dropdown');
  if (dd) dd.classList.remove('open');

  // Apply macro actions visually
  const macro = (window._simMacros || [])[idx];
  const L = window._simL;
  if (macro && macro.actions) {
    const firstName = window._simSetup ? window._simSetup.requester.split(' ')[0] : '';
    macro.actions.forEach(action => {
      if (action.type === 'reply' || action.type === 'internal') {
        const ta = document.getElementById('zd-reply-area');
        const modeBtn = document.getElementById('mode-btn');
        const modeIcon = document.getElementById('mode-icon');
        const modeLabel = document.getElementById('mode-label');
        let text = typeof action.text === 'object' ? (action.text[L] || action.text.fr) : action.text;
        text = text.replace(/\{\{first_name\}\}/g, firstName);
        if (ta) { ta.value = text; }
        if (action.type === 'internal') {
          if (modeBtn) modeBtn.classList.add('internal-mode');
          if (modeIcon) modeIcon.textContent = '🔒';
          if (modeLabel) modeLabel.textContent = L==='fr'?'Note interne':'Internal note';
          if (ta) { ta.classList.add('internal-bg'); ta.placeholder = L==='fr'?'Note interne...':'Internal note...'; }
        } else {
          if (modeBtn) modeBtn.classList.remove('internal-mode');
          if (modeIcon) modeIcon.textContent = '↩';
          if (modeLabel) modeLabel.textContent = L==='fr'?'Réponse publique':'Public reply';
          if (ta) { ta.classList.remove('internal-bg'); }
        }
      } else if (action.type === 'status') {
        const submitBtn = document.getElementById('submit-main');
        const labels = {open:L==='fr'?'Ouvert':'Open', pending:L==='fr'?'En attente':'Pending', solved:L==='fr'?'Résolu':'Solved'};
        if (submitBtn) submitBtn.textContent = (L==='fr'?'Soumettre comme ':'Submit as ') + (labels[action.value]||action.value);
        window._simPendingStatus = action.value;
      } else if (action.type === 'priority') {
        const sel = document.getElementById('field-priority');
        if (sel) sel.value = action.value;
      }
    });
    // Toast notification
    const simArea = document.getElementById('zd-sim-area');
    if (simArea) {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);background:#2F3941;color:white;padding:6px 18px;border-radius:20px;font-size:11px;z-index:200;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none';
      toast.textContent = (L==='fr'?'✓ Macro appliquée : ':'✓ Macro applied: ') + macro.name;
      simArea.style.position = 'relative';
      simArea.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  }

  const target = ex.target;
  const correct = target.action === 'apply-macro' && (target.macroIndex === idx || target.macroIndex === undefined);

  if (target.action === 'apply-macro' && correct) {
    // Phase 2: macro applied correctly — now ask to submit
    const fb = document.getElementById('sim-feedback');
    if (fb) {
      fb.className = 'sim-feedback-banner show ok';
      fb.innerHTML = '✅ ' + (L==='fr'
        ? 'Macro appliquée ! Relisez et personnalisez le texte si besoin, puis soumettez comme En attente.'
        : 'Macro applied! Review and personalize the text if needed, then submit as Pending.');
    }
    ex.target = { action: 'submit', element: 'submit-main' };
    const instrEl = document.getElementById('sim-instruction-text');
    if (instrEl) instrEl.textContent = L==='fr'
      ? 'Le texte est pré-rempli. Personnalisez-le si besoin, puis cliquez sur "Soumettre comme En attente".'
      : 'The text is pre-filled. Personalize it if needed, then click "Submit as Pending".';
    setTimeout(() => highlightTarget(ex.target), 400);
  } else {
    _simHandleResult(correct, ex);
  }
}

function filterMacros(val) {
  const q = (val || '').toLowerCase();
  document.querySelectorAll('.zd-macro-item').forEach(el => {
    el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function toggleMacroDropdown() {
  const dd = document.getElementById('macro-dropdown');
  if (!dd) return;
  const willOpen = !dd.classList.contains('open');
  dd.classList.toggle('open');
  if (willOpen) {
    const inp = document.getElementById('macro-search-input');
    if (inp) { inp.value = ''; filterMacros(''); setTimeout(()=>inp.focus(), 50); }
  }
  const ex = window._simExercise;
  if (ex && ex.target && ex.target.action === 'open-macro' && !window._simAnswered) {
    _simHandleResult(true, ex);
  }
}

function toggleSubmitDropdown() {
  const dd = document.getElementById('submit-dropdown');
  if (dd) dd.classList.toggle('open');
}

function toggleDotMenu() {
  const dd = document.getElementById('dot-menu');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function simRetry() {
  const ex = window._simExercise;
  const L = window._simL;
  const container = document.getElementById('sim-exercise-container');
  if (container && ex) renderSimExercise(ex, container, L);
}

function _simHandleResult(correct, ex) {
  if (window._simAnswered) return;
  window._simAnswered = true;

  const L = window._simL;
  const fb = document.getElementById('sim-feedback');
  fb.className = 'sim-feedback-banner show ' + (correct ? 'ok' : 'ko');
  const retryBtn = correct ? '' : `<button class="sim-retry-btn" onclick="simRetry()">↺ ${L==='fr'?'Réessayer':'Retry'}</button>`;
  fb.innerHTML = (correct ? '✅ ' : '❌ ') + (correct ? ex.feedback.correct[L] : ex.feedback.wrong[L]) + retryBtn;

  // Remove highlights
  document.querySelectorAll('.zd-highlight').forEach(el => el.classList.remove('zd-highlight'));

  // Update status pills if a status was submitted
  if (correct && window._simPendingStatus) {
    const newStatus = window._simPendingStatus;
    const statusMap = {open:'Open', pending:'Pending', solved:'Solved', hold:'On-hold'};
    const label = statusMap[newStatus] || newStatus;
    ['ticket-status-pill', 'ih-status-pill'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.className = `zd-status-pill sp-${newStatus}`;
        el.textContent = label;
      }
    });
    window._simPendingStatus = null;
  }

  // Celebrate target element + floating emoji reaction on correct answer
  if (correct && ex.target && ex.target.element) {
    const targetEl = document.getElementById(ex.target.element);
    if (targetEl) {
      targetEl.classList.add('zd-celebrate');
      setTimeout(() => { if (targetEl) targetEl.classList.remove('zd-celebrate'); }, 900);
    }
    const simArea = document.getElementById('zd-sim-area');
    const simWrap = simArea && simArea.parentElement;
    if (targetEl && simWrap) {
      const targetRect = targetEl.getBoundingClientRect();
      const wrapRect = simWrap.getBoundingClientRect();
      const baseLeft = targetRect.left - wrapRect.left + targetRect.width / 2;
      const baseTop  = targetRect.top  - wrapRect.top;
      const emojiList = ['🎉', '🎊', '✨', '🎉', '⭐'];
      emojiList.forEach((emoji, i) => {
        const reaction = document.createElement('div');
        reaction.className = 'zd-reaction';
        reaction.textContent = emoji;
        reaction.style.left = baseLeft + 'px';
        reaction.style.top  = baseTop  + 'px';
        reaction.style.setProperty('--drift', ((i - 2) * 70) + 'px');
        reaction.style.animationDelay = (i * 70) + 'ms';
        simWrap.appendChild(reaction);
        setTimeout(() => { if (reaction.parentNode) reaction.remove(); }, 1700 + i * 70);
      });
    }
  }

  // Update progress
  if (correct) {
    const lesKey = MODULES[state.mod].lessons[state.les].key;
    state.done[lesKey] = true;
    updateProgress();
    renderSidebar();
  }

  // Flash the sim area
  const sim = document.getElementById('zd-sim-area');
  if (sim) {
    sim.style.transition = 'all .3s';
    sim.style.borderColor = correct ? '#10B981' : '#EF4444';
    setTimeout(()=>{ if(sim) sim.style.borderColor=''; }, 2000);
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#macro-btn') && !e.target.closest('#macro-dropdown')) {
    const dd = document.getElementById('macro-dropdown');
    if (dd) dd.classList.remove('open');
  }
  if (!e.target.closest('#submit-arr') && !e.target.closest('#submit-dropdown')) {
    const dd = document.getElementById('submit-dropdown');
    if (dd) dd.classList.remove('open');
  }
  if (!e.target.closest('#dot-menu-btn') && !e.target.closest('#dot-menu')) {
    const dd = document.getElementById('dot-menu');
    if (dd) dd.style.display = 'none';
  }
  if (!e.target.closest('#mode-btn') && !e.target.closest('#mode-dropdown')) {
    const dd = document.getElementById('mode-dropdown');
    if (dd) dd.style.display = 'none';
  }
});
