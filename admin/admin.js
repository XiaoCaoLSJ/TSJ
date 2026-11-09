/**
 * TSJ Admin — static content manager
 * Password gate + GitHub Contents API publishing (data/site.json).
 */
(function () {
    'use strict';

    /* ------------------------------------------------------------------
     * Config
     * ---------------------------------------------------------------- */
    var AUTH_USER = 'TSJ_DSG';
    var AUTH_HASH = '67fcf002f94c0c816c6f8bef5e0b9b6b33c971b7b4db8d1beb1b7ac9c82eee65';
    var AUTH_PLAIN_B64 = 'MjAyN2ZvcnR1bmUh';

    var SESSION_KEY = 'tsj_admin_session';
    var GH_KEY = 'tsj_admin_github';
    var SESSION_HOURS = 12;

    var SITE_PATH = 'data/site.json';
    var UPLOAD_DIR = 'assets/uploads';

    var DEFAULT_GH = {
        owner: 'XiaoCaoLSJ',
        repo: 'TSJ',
        branch: 'main',
        token: ''
    };

    var SECTIONS = [
        { key: 'meta', label: '站点信息 (SEO)', icon: 'fa-solid fa-circle-info' },
        { key: 'brand', label: '品牌标识', icon: 'fa-solid fa-tag' },
        { key: 'contact', label: '联系方式', icon: 'fa-solid fa-address-book' },
        { key: 'leadSettings', label: '邮件 / 线索接收', icon: 'fa-solid fa-envelope-open-text' },
        { key: 'popup', label: '10 秒弹窗', icon: 'fa-solid fa-window-restore' },
        { key: 'hero', label: '首屏轮播', icon: 'fa-solid fa-images' },
        { key: 'stats', label: '数据统计', icon: 'fa-solid fa-chart-simple' },
        { key: 'materials', label: '板材质量', icon: 'fa-solid fa-layer-group' },
        { key: 'craft', label: '做工细节', icon: 'fa-solid fa-ruler-combined' },
        { key: 'pricing', label: '价格优势', icon: 'fa-solid fa-tags' },
        { key: 'collections', label: '系列展示', icon: 'fa-solid fa-couch' },
        { key: 'categories', label: '产品分类', icon: 'fa-solid fa-border-all' },
        { key: 'portfolio', label: '案例展示', icon: 'fa-solid fa-camera-retro' },
        { key: 'why', label: '我们的优势', icon: 'fa-solid fa-award' },
        { key: 'process', label: '服务流程', icon: 'fa-solid fa-list-ol' },
        { key: 'cta', label: '行动号召', icon: 'fa-solid fa-bullhorn' },
        { key: 'contactSection', label: '联系板块文案', icon: 'fa-solid fa-comments' },
        { key: 'footer', label: '页脚', icon: 'fa-solid fa-shoe-prints' }
    ];

    var LABELS = {
        meta: '基础信息', hero: '首屏内容', materials: '板材内容', craft: '做工内容',
        pricing: '价格内容', collections: '系列内容', categories: '产品分类内容',
        portfolio: '案例内容', why: '优势内容', process: '流程内容', cta: '行动号召',
        contactSection: '联系板块', footer: '页脚信息', brand: '品牌信息',
        contact: '联系方式', leadSettings: '线索接收设置', popup: '弹窗设置',
        stats: '数据统计', slides: '轮播图', cards: '卡片', items: '条目',
        title: '标题', titleAccent: '标题强调（斜体部分）', description: '描述', desc: '描述',
        eyebrow: '小标题', subtitle: '副标题', image: '图片地址', images: '图片',
        cards: '卡片', items: '条目', steps: '步骤', rows: '价格行', bullets: '要点',
        note: '备注', badges: '认证标签', specs: '规格表', label: '名称', value: '数值',
        slides: '轮播图', mark: 'Logo 字母', name: '名称', tagline: '标语',
        email: '邮箱', phone: '电话', whatsapp: 'WhatsApp 号码（纯数字）',
        address: '地址', hours: '服务时间',
        recipientEmail: '接收线索的邮箱', provider: '发送方式',
        webhookUrl: 'Webhook 地址', emailjsServiceId: 'EmailJS Service ID',
        emailjsTemplateId: 'EmailJS Template ID', emailjsPublicKey: 'EmailJS Public Key',
        web3formsKey: 'Web3Forms Access Key',
        successMessage: '提交成功提示', errorMessage: '发送失败提示',
        enabled: '启用弹窗', delaySeconds: '延迟秒数', frequency: '显示频率',
        badge: '角标文字', submitText: '按钮文字',
        successTitle: '成功标题', successDesc: '成功描述',
        icon: '图标类名', ctaTitle: 'CTA 标题', ctaDesc: 'CTA 描述', ctaButton: 'CTA 按钮',
        columnA: '对比列 1（零售）', columnB: '对比列 2（我们）',
        retail: '零售价', tsj: '我们的价格', save: '节省', item: '项目',
        location: '地区', units: '数量', about: '简介', copyright: '版权信息',
        updatedAt: '更新时间', formTitle: '表单标题', formDesc: '表单描述',
        tag: '标签', link: '链接', points: '亮点数据', details: '细节列表',
        badgeValue: '角标数值', badgeText: '角标文字', button: '按钮文字',
        emailButton: '邮件按钮文字', primaryText: '按钮 1 文字', primaryHref: '按钮 1 链接',
        secondaryText: '按钮 2 文字', secondaryHref: '按钮 2 链接'
    };

    var SELECTS = {
        provider: [
            ['formsubmit', 'FormSubmit（免注册，推荐）'],
            ['emailjs', 'EmailJS（需 Service/Template/Key）'],
            ['web3forms', 'Web3Forms（需 Access Key）'],
            ['webhook', '自定义 Webhook'],
            ['none', '关闭（不发送）']
        ],
        frequency: [
            ['session', '每个会话一次'],
            ['week', '每 7 天一次'],
            ['always', '每次访问都弹']
        ]
    };

    /* ------------------------------------------------------------------
     * State
     * ---------------------------------------------------------------- */
    var state = {
        config: null,
        sha: null,
        view: 'meta',
        gh: Object.assign({}, DEFAULT_GH),
        dirty: false,
        remoteOk: false,
        lastSaved: null
    };

    /* ------------------------------------------------------------------
     * Helpers
     * ---------------------------------------------------------------- */
    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function esc(v) {
        return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function toB64(str) {
        var bytes = new TextEncoder().encode(str);
        var bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    function fromB64(str) {
        var bin = atob(String(str).replace(/\s/g, ''));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    function labelFor(key) {
        if (LABELS[key]) return LABELS[key];
        return String(key).replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); });
    }

    function getAt(path) {
        var cur = state.config;
        for (var i = 0; i < path.length; i++) {
            if (cur == null) return undefined;
            cur = cur[path[i]];
        }
        return cur;
    }

    function setAt(path, value) {
        var cur = state.config;
        for (var i = 0; i < path.length - 1; i++) cur = cur[path[i]];
        cur[path[path.length - 1]] = value;
    }

    function toast(message, type) {
        var wrap = $('#toastWrap');
        if (!wrap) return;
        var el = document.createElement('div');
        el.className = 'toast' + (type ? ' ' + type : '');
        el.textContent = message;
        wrap.appendChild(el);
        setTimeout(function () { el.remove(); }, 4200);
    }

    function blankLike(obj) {
        if (Array.isArray(obj)) return obj.length ? [blankLike(obj[0])] : [];
        if (obj && typeof obj === 'object') {
            var out = {};
            Object.keys(obj).forEach(function (k) { out[k] = blankLike(obj[k]); });
            return out;
        }
        if (typeof obj === 'number') return 0;
        if (typeof obj === 'boolean') return false;
        return '';
    }

    /* ------------------------------------------------------------------
     * Auth
     * ---------------------------------------------------------------- */
    function sha256Hex(text) {
        if (!window.crypto || !window.crypto.subtle) return Promise.resolve(null);
        return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
            .then(function (buf) {
                return Array.prototype.map.call(new Uint8Array(buf), function (b) {
                    return ('00' + b.toString(16)).slice(-2);
                }).join('');
            })
            .catch(function () { return null; });
    }

    function sessionValid() {
        try {
            var raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            var data = JSON.parse(raw);
            return data && data.exp > Date.now();
        } catch (e) { return false; }
    }

    function startSession() {
        localStorage.setItem(SESSION_KEY, JSON.stringify({
            user: AUTH_USER,
            exp: Date.now() + SESSION_HOURS * 3600 * 1000
        }));
    }

    function initLogin() {
        var form = $('#loginForm');
        var error = $('#loginError');

        if (sessionValid()) { showApp(); return; }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            error.textContent = '';
            var user = $('#loginUser').value.trim();
            var pass = $('#loginPass').value;

            if (user !== AUTH_USER) {
                error.textContent = '账号或密码错误。';
                return;
            }

            sha256Hex(pass).then(function (hash) {
                var ok = hash ? hash === AUTH_HASH : pass === atob(AUTH_PLAIN_B64);
                if (!ok) {
                    error.textContent = '账号或密码错误。';
                    return;
                }
                startSession();
                showApp();
            });
        });
    }

    /* ------------------------------------------------------------------
     * Boot
     * ---------------------------------------------------------------- */
    function showApp() {
        $('#loginView').hidden = true;
        $('#appView').hidden = false;
        loadGhSettings();
        renderSidebar();
        bindTopbar();
        loadConfig();
    }

    function bindTopbar() {
        $('#saveBtn').addEventListener('click', save);
        $('#saveBtnBottom').addEventListener('click', save);
        $('#reloadBtn').addEventListener('click', function () {
            if (state.dirty && !confirm('有未发布的修改，重新加载会丢失。继续？')) return;
            loadConfig(true);
        });
        $('#logoutBtn').addEventListener('click', function () {
            localStorage.removeItem(SESSION_KEY);
            location.reload();
        });
        $$('.side-item[data-view]').forEach(function (btn) {
            btn.addEventListener('click', function () { setView(btn.getAttribute('data-view')); });
        });
    }

    function loadGhSettings() {
        try {
            var raw = localStorage.getItem(GH_KEY);
            if (raw) state.gh = Object.assign({}, DEFAULT_GH, JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }

    function saveGhSettings() {
        localStorage.setItem(GH_KEY, JSON.stringify(state.gh));
    }

    function renderSidebar() {
        var nav = $('#sideNav');
        var known = {};
        SECTIONS.forEach(function (s) { known[s.key] = true; });

        var html = SECTIONS.map(function (s) {
            var disabled = state.config && !(s.key in state.config);
            return '<button class="side-item" data-view="' + s.key + '"' + (disabled ? ' data-missing="1"' : '') + '>' +
                '<i class="' + s.icon + '"></i> ' + esc(s.label) + '</button>';
        }).join('');

        if (state.config) {
            Object.keys(state.config).forEach(function (key) {
                if (known[key]) return;
                html += '<button class="side-item" data-view="' + esc(key) + '"><i class="fa-solid fa-cube"></i> ' + esc(labelFor(key)) + '</button>';
            });
        }

        nav.innerHTML = html;
        $$('button.side-item[data-view]', nav).forEach(function (btn) {
            btn.addEventListener('click', function () { setView(btn.getAttribute('data-view')); });
        });
        $('#sidebarRepo').textContent = state.gh.owner + '/' + state.gh.repo;
    }

    function setView(view) {
        state.view = view;
        $$('.side-item').forEach(function (b) {
            b.classList.toggle('is-active', b.getAttribute('data-view') === view);
        });
        renderPanel();
    }

    /* ------------------------------------------------------------------
     * Data loading
     * ---------------------------------------------------------------- */
    function ghHeaders() {
        return {
            'Authorization': 'Bearer ' + state.gh.token,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        };
    }

    function ghUrl(path) {
        return 'https://api.github.com/repos/' + state.gh.owner + '/' + state.gh.repo + '/contents/' + path;
    }

    function loadConfig(forceRemote) {
        setStatus('loading', '正在加载内容…');

        var useRemote = state.gh.token && state.gh.token.length > 20;
        var req;

        if (useRemote) {
            req = fetch(ghUrl(SITE_PATH) + '?ref=' + encodeURIComponent(state.gh.branch || 'master') + '&t=' + Date.now(), {
                headers: ghHeaders(),
                cache: 'no-store'
            }).then(function (res) {
                if (!res.ok) throw new Error('GitHub API ' + res.status);
                return res.json();
            }).then(function (data) {
                state.sha = data.sha;
                state.remoteOk = true;
                return JSON.parse(fromB64(data.content));
            });
        } else {
            req = fetch('../data/site.json?v=' + Date.now(), { cache: 'no-store' }).then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                state.remoteOk = false;
                state.sha = null;
                return res.json();
            });
        }

        req.then(function (json) {
            state.config = json;
            state.dirty = false;
            renderSidebar();
            setView(state.view in json ? state.view : 'meta');
            updateSaveState();
        }).catch(function (err) {
            console.error(err);
            setStatus('error', '读取内容失败：' + err.message + '（请检查「连接与发布」）');
            if (!state.config) {
                state.config = {};
                renderSidebar();
                renderPanel();
            }
        });
    }

    function setStatus(type, text) {
        var bar = $('#statusBar');
        if (!bar) return;
        bar.className = 'status-bar status-bar--' + type;
        bar.innerHTML = '<i class="fa-solid fa-circle-info"></i> ' + esc(text);
    }

    function updateSaveState() {
        var hint = state.dirty ? '有未发布的修改' : '内容已同步';
        $('#panelSub').textContent = state.dirty
            ? '有未发布的修改 — 点击「保存并发布」后生效。'
            : (state.lastSaved ? '上次发布：' + state.lastSaved : '修改后点击「保存并发布」，网页刷新即可看到最新内容。');

        if (!state.gh.token) {
            setStatus('warn', '未配置 GitHub Token：只能本地编辑和下载 JSON，无法直接发布。请到「连接与发布」配置。');
        } else if (state.remoteOk) {
            setStatus('ok', '已连接 ' + state.gh.owner + '/' + state.gh.repo + '@' + state.gh.branch + ' · ' + hint);
        } else {
            setStatus('warn', '已填写 Token 但尚未读取仓库：保存时会自动同步。');
        }
        $('#saveBtn').classList.toggle('has-dirty', state.dirty);
    }

    /* ------------------------------------------------------------------
     * Panel rendering
     * ---------------------------------------------------------------- */
    function renderPanel() {
        var panel = $('#panel');
        var title = $('#panelTitle');
        panel.innerHTML = '';

        if (state.view === 'github') {
            title.textContent = '连接与发布';
            renderGithub(panel);
            return;
        }
        if (state.view === 'json') {
            title.textContent = '高级（JSON 编辑）';
            renderJson(panel);
            return;
        }

        var section = SECTIONS.filter(function (s) { return s.key === state.view; })[0];
        title.textContent = section ? section.label : labelFor(state.view);

        if (!state.config || !(state.view in state.config)) {
            panel.innerHTML = '<div class="card"><p class="muted">该区块不存在，可能是数据尚未加载。</p></div>';
            return;
        }

        panel.appendChild(buildNode(state.view, state.config[state.view], [state.view]));

        if (state.view === 'leadSettings') {
            panel.appendChild(testCard());
        }
        updateSaveState();

        requestAnimationFrame(function () {
            $$('#panel textarea').forEach(function (area) {
                area.style.height = 'auto';
                area.style.height = Math.min(area.scrollHeight + 2, 420) + 'px';
            });
        });
    }

    function buildNode(key, value, path) {
        if (Array.isArray(value)) return buildArray(key, value, path);
        if (value && typeof value === 'object') return buildGroup(key, value, path);
        return buildField(key, value, path);
    }

    function buildGroup(key, obj, path) {
        var card = document.createElement('section');
        card.className = 'card';

        var head = document.createElement('div');
        head.className = 'card-head';
        head.innerHTML = '<h3>' + esc(labelFor(key)) + '</h3>';
        card.appendChild(head);

        var grid = document.createElement('div');
        grid.className = 'grid';
        Object.keys(obj).forEach(function (k) {
            grid.appendChild(buildNode(k, obj[k], path.concat(k)));
        });
        card.appendChild(grid);
        return card;
    }

    function buildArray(key, arr, path) {
        var card = document.createElement('section');
        card.className = 'card';

        var head = document.createElement('div');
        head.className = 'card-head';
        head.innerHTML = '<h3>' + esc(labelFor(key)) + ' <span class="count">' + arr.length + '</span></h3>';

        var addBtn = document.createElement('button');
        addBtn.className = 'btn btn-ghost btn-sm';
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> 新增';
        addBtn.addEventListener('click', function () {
            var list = getAt(path);
            var template = list.length ? blankLike(list[list.length - 1]) : (typeof arr[0] === 'string' ? '' : {});
            list.push(template);
            touched();
            renderPanel();
        });
        head.appendChild(addBtn);
        card.appendChild(head);

        var list = document.createElement('div');
        list.className = 'list';

        arr.forEach(function (item, index) {
            var row = document.createElement('div');
            row.className = 'list-row' + (item && typeof item === 'object' ? ' list-row--card' : '');

            var tools = document.createElement('div');
            tools.className = 'list-tools';
            tools.innerHTML = '<span class="idx">' + (index + 1) + '</span>' +
                '<button class="icon-btn" data-act="up" title="上移"><i class="fa-solid fa-arrow-up"></i></button>' +
                '<button class="icon-btn" data-act="down" title="下移"><i class="fa-solid fa-arrow-down"></i></button>' +
                '<button class="icon-btn icon-btn--danger" data-act="del" title="删除"><i class="fa-solid fa-trash"></i></button>';

            tools.addEventListener('click', function (e) {
                var btn = e.target.closest('button[data-act]');
                if (!btn) return;
                var act = btn.getAttribute('data-act');
                var list = getAt(path);
                if (act === 'del') {
                    if (!confirm('删除第 ' + (index + 1) + ' 项？')) return;
                    list.splice(index, 1);
                } else if (act === 'up' && index > 0) {
                    var tmp = list[index - 1]; list[index - 1] = list[index]; list[index] = tmp;
                } else if (act === 'down' && index < list.length - 1) {
                    var tmp2 = list[index + 1]; list[index + 1] = list[index]; list[index] = tmp2;
                }
                touched();
                renderPanel();
            });

            row.appendChild(tools);

            if (item && typeof item === 'object') {
                var body = document.createElement('div');
                body.className = 'grid';
                Object.keys(item).forEach(function (k) {
                    body.appendChild(buildNode(k, item[k], path.concat(index, k)));
                });
                row.appendChild(body);
            } else {
                var inline = buildField(labelFor(key), item, path.concat(index));
                row.appendChild(inline);
            }

            list.appendChild(row);
        });

        card.appendChild(list);
        return card;
    }

    function resolveImage(url) {
        if (!url) return '';
        if (/^(https?:|data:|\/)/.test(url)) return url;
        return '../' + url;
    }

    function isImageKey(key) {
        return /(^|_)(image|images|img|logo|photo|banner)$/i.test(key) || /Image$/.test(key);
    }

    function isLongText(key, value) {
        if (typeof value !== 'string') return false;
        if (/^(desc|description|about|message|note|notes|errorMessage|successMessage|successDesc|subtitle)$/.test(key)) return true;
        return value.length > 90;
    }

    function buildField(key, value, path) {
        var wrap = document.createElement('div');
        wrap.className = 'fld';

        if (typeof value === 'boolean') {
            wrap.className = 'fld fld--switch';
            var sw = document.createElement('input');
            sw.type = 'checkbox';
            sw.checked = !!value;
            sw.addEventListener('change', function () { setAt(path, sw.checked); touched(); });
            var txt = document.createElement('span');
            txt.textContent = labelFor(key);
            wrap.appendChild(sw);
            wrap.appendChild(txt);
            return wrap;
        }

        var label = document.createElement('span');
        label.className = 'lbl';
        label.textContent = labelFor(key);
        wrap.appendChild(label);

        var control;

        if (SELECTS[key]) {
            control = document.createElement('select');
            SELECTS[key].forEach(function (opt) {
                var o = document.createElement('option');
                o.value = opt[0];
                o.textContent = opt[1];
                control.appendChild(o);
            });
            control.value = value == null ? '' : String(value);
            control.addEventListener('change', function () { setAt(path, control.value); touched(); });
        } else if (typeof value === 'number') {
            control = document.createElement('input');
            control.type = 'number';
            control.min = '0';
            control.step = '1';
            control.value = value;
            control.addEventListener('input', function () {
                setAt(path, control.value === '' ? 0 : Number(control.value));
                touched();
            });
        } else if (isImageKey(key)) {
            control = buildImageField(value, path);
        } else if (isLongText(key, value)) {
            control = document.createElement('textarea');
            control.rows = 3;
            control.value = value || '';
            control.addEventListener('input', function () {
                setAt(path, control.value);
                touched();
                control.style.height = 'auto';
                control.style.height = Math.min(control.scrollHeight + 2, 420) + 'px';
            });
        } else {
            control = document.createElement('input');
            control.type = 'text';
            control.value = value == null ? '' : value;
            if (key === 'icon') control.placeholder = '例如 fas fa-layer-group';
            control.addEventListener('input', function () { setAt(path, control.value); touched(); });
        }

        wrap.appendChild(control);
        return wrap;
    }

    function buildImageField(value, path) {
        var box = document.createElement('div');
        box.className = 'image-field';

        var thumb = document.createElement('div');
        thumb.className = 'image-thumb';
        thumb.innerHTML = value ? '<img src="' + esc(resolveImage(value)) + '" alt="">' : '<span>无图片</span>';

        var input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';
        input.placeholder = 'https://... 或点击右侧上传';
        input.addEventListener('input', function () {
            setAt(path, input.value);
            thumb.innerHTML = input.value ? '<img src="' + esc(resolveImage(input.value)) + '" alt="">' : '<span>无图片</span>';
            touched();
        });

        var actions = document.createElement('div');
        actions.className = 'image-actions';

        var fileLabel = document.createElement('label');
        fileLabel.className = 'btn btn-ghost btn-sm';
        fileLabel.innerHTML = '<i class="fa-solid fa-upload"></i> 上传';
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.hidden = true;
        fileInput.addEventListener('change', function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (!state.gh.token) { toast('请先在「连接与发布」配置 GitHub Token', 'error'); return; }
            fileLabel.classList.add('is-loading');
            uploadImage(file).then(function (url) {
                input.value = url;
                setAt(path, url);
                thumb.innerHTML = '<img src="' + esc(resolveImage(url)) + '" alt="">';
                touched();
                toast('图片已上传', 'success');
            }).catch(function (err) {
                toast('上传失败：' + err.message, 'error');
            }).then(function () {
                fileLabel.classList.remove('is-loading');
                fileInput.value = '';
            });
        });
        fileLabel.appendChild(fileInput);
        actions.appendChild(fileLabel);

        var wrapRow = document.createElement('div');
        wrapRow.className = 'image-row';
        wrapRow.appendChild(input);
        wrapRow.appendChild(actions);
        box.appendChild(thumb);
        box.appendChild(wrapRow);
        return box;
    }

    function touched() {
        state.dirty = true;
        updateSaveState();
    }

    /* ------------------------------------------------------------------
     * GitHub publish
     * ---------------------------------------------------------------- */
    function uploadImage(file) {
        var safeName = file.name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
        var path = UPLOAD_DIR + '/' + Date.now() + '-' + safeName;

        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var base64 = String(reader.result).split(',')[1];
                fetch(ghUrl(path), {
                    method: 'PUT',
                    headers: ghHeaders(),
                    body: JSON.stringify({
                        message: 'assets: upload ' + file.name,
                        content: base64,
                        branch: state.gh.branch || 'master'
                    })
                }).then(function (res) {
                    return res.json().then(function (data) {
                        if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
                        resolve(data.content.download_url);
                    });
                }).catch(reject);
            };
            reader.onerror = function () { reject(new Error('无法读取文件')); };
            reader.readAsDataURL(file);
        });
    }

    function save() {
        if (!state.config) return;
        if (!state.gh.token) {
            toast('未配置 GitHub Token，已改为下载 JSON 文件', 'error');
            downloadJson();
            setView('github');
            return;
        }

        var btns = [$('#saveBtn'), $('#saveBtnBottom')];
        btns.forEach(function (b) { b.disabled = true; b.classList.add('is-loading'); });

        state.config.meta = state.config.meta || {};
        state.config.meta.updatedAt = new Date().toISOString().slice(0, 10);
        var body = JSON.stringify(state.config, null, 2) + '\n';

        putContent(SITE_PATH, body, 'content: update site data ' + new Date().toLocaleString('en-GB'))
            .then(function (data) {
                state.sha = data.content.sha;
                state.dirty = false;
                state.lastSaved = new Date().toLocaleString('en-GB');
                toast('已发布，约 30–60 秒后网页生效', 'success');
                updateSaveState();
            })
            .catch(function (err) {
                if (err.status === 409) {
                    toast('仓库内容已被更新，正在同步后重试…', 'error');
                    return syncShaThenRetry(body);
                }
                toast('发布失败：' + err.message, 'error');
                setStatus('error', '发布失败：' + err.message);
            })
            .then(function () {
                btns.forEach(function (b) { b.disabled = false; b.classList.remove('is-loading'); });
            });
    }

    function putContent(path, text, message) {
        var body = {
            message: message,
            content: toB64(text),
            branch: state.gh.branch || 'master'
        };
        if (state.sha) body.sha = state.sha;

        return fetch(ghUrl(path), {
            method: 'PUT',
            headers: ghHeaders(),
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.json().then(function (data) {
                if (!res.ok) {
                    var err = new Error(data.message || ('HTTP ' + res.status));
                    err.status = res.status;
                    throw err;
                }
                state.remoteOk = true;
                return data;
            });
        });
    }

    function syncShaThenRetry(text) {
        return fetch(ghUrl(SITE_PATH) + '?ref=' + encodeURIComponent(state.gh.branch || 'master') + '&t=' + Date.now(), {
            headers: ghHeaders(),
            cache: 'no-store'
        }).then(function (res) { return res.json(); })
            .then(function (data) {
                state.sha = data.sha;
                return putContent(SITE_PATH, text, 'content: update site data');
            })
            .then(function (data) {
                state.sha = data.content.sha;
                state.dirty = false;
                state.lastSaved = new Date().toLocaleString('en-GB');
                toast('已发布，约 30–60 秒后网页生效', 'success');
                updateSaveState();
            });
    }

    function downloadJson() {
        var blob = new Blob([JSON.stringify(state.config, null, 2) + '\n'], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'site.json';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }

    /* ------------------------------------------------------------------
     * Special views
     * ---------------------------------------------------------------- */
    function renderGithub(panel) {
        var card = document.createElement('section');
        card.className = 'card';
        card.innerHTML =
            '<div class="card-head"><h3>GitHub 仓库连接</h3></div>' +
            '<p class="muted">后台与网站使用同一个仓库。填写一个有 <b>Contents: Read and write</b> 权限的 Fine-grained Token，' +
            '保存时会直接提交 <code>' + SITE_PATH + '</code>，GitHub Pages 会自动重新发布。</p>' +
            '<div class="grid grid--2">' +
            '<div class="fld"><span class="lbl">仓库所有者</span><input type="text" id="ghOwner"></div>' +
            '<div class="fld"><span class="lbl">仓库名称</span><input type="text" id="ghRepo"></div>' +
            '<div class="fld"><span class="lbl">分支</span><input type="text" id="ghBranch" placeholder="master"></div>' +
            '<div class="fld"><span class="lbl">GitHub Token</span><input type="password" id="ghToken" placeholder="ghp_... 或 github_pat_..."></div>' +
            '</div>' +
            '<div class="row-actions">' +
            '<button class="btn btn-primary btn-sm" id="ghSave">保存连接</button>' +
            '<button class="btn btn-ghost btn-sm" id="ghTest">测试连接</button>' +
            '<button class="btn btn-ghost btn-sm" id="ghDownload"><i class="fa-solid fa-download"></i> 下载 JSON</button>' +
            '</div>' +
            '<p class="hint">Token 只保存在当前浏览器的 localStorage，不会写入网站文件。</p>' +
            '<div class="divider"></div>' +
            '<h4>Token 创建步骤</h4>' +
            '<ol class="steps-list">' +
            '<li>打开 GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b>。</li>' +
            '<li>Repository access 选择 <b>Only select repositories</b> → 选中 <code>' + esc(state.gh.owner + '/' + state.gh.repo) + '</code>。</li>' +
            '<li>Permissions → Repository permissions → <b>Contents: Read and write</b>。</li>' +
            '<li>生成后复制到上方「GitHub Token」，点击「保存连接」。</li>' +
            '</ol>';

        panel.appendChild(card);

        $('#ghOwner').value = state.gh.owner;
        $('#ghRepo').value = state.gh.repo;
        $('#ghBranch').value = state.gh.branch;
        $('#ghToken').value = state.gh.token;

        $('#ghSave').addEventListener('click', function () {
            state.gh.owner = $('#ghOwner').value.trim();
            state.gh.repo = $('#ghRepo').value.trim();
            state.gh.branch = $('#ghBranch').value.trim() || 'master';
            state.gh.token = $('#ghToken').value.trim();
            saveGhSettings();
            renderSidebar();
            toast('连接信息已保存', 'success');
            loadConfig(true);
        });

        $('#ghTest').addEventListener('click', function () {
            if (!state.gh.token) { toast('请先填写 Token', 'error'); return; }
            $('#ghTest').classList.add('is-loading');
            fetch(ghUrl(SITE_PATH) + '?ref=' + encodeURIComponent(state.gh.branch || 'master') + '&t=' + Date.now(), {
                headers: ghHeaders(),
                cache: 'no-store'
            }).then(function (res) {
                if (res.ok) toast('连接成功，可以发布', 'success');
                else if (res.status === 404) toast('连接成功，但仓库中还没有 data/site.json（首次发布会自动创建）', 'success');
                else if (res.status === 401 || res.status === 403) toast('Token 无效或权限不足', 'error');
                else toast('连接失败：HTTP ' + res.status, 'error');
            }).catch(function () {
                toast('网络错误，无法连接 GitHub', 'error');
            }).then(function () {
                $('#ghTest').classList.remove('is-loading');
            });
        });

        $('#ghDownload').addEventListener('click', downloadJson);
    }

    function renderJson(panel) {
        var card = document.createElement('section');
        card.className = 'card';
        card.innerHTML =
            '<div class="card-head"><h3>完整配置（JSON）</h3>' +
            '<div><button class="btn btn-ghost btn-sm" id="jsonFormat">格式化</button> ' +
            '<button class="btn btn-primary btn-sm" id="jsonApply">应用到表单</button></div></div>' +
            '<p class="muted">高级用法：可直接编辑完整 JSON。应用后点击右上角「保存并发布」。</p>' +
            '<textarea class="json-area" id="jsonArea" spellcheck="false"></textarea>';

        panel.appendChild(card);
        var area = $('#jsonArea');
        area.value = JSON.stringify(state.config, null, 2);

        $('#jsonFormat').addEventListener('click', function () {
            try {
                area.value = JSON.stringify(JSON.parse(area.value), null, 2);
                toast('已格式化', 'success');
            } catch (e) {
                toast('JSON 格式错误：' + e.message, 'error');
            }
        });

        $('#jsonApply').addEventListener('click', function () {
            try {
                var parsed = JSON.parse(area.value);
                state.config = parsed;
                state.dirty = true;
                renderSidebar();
                setView('meta');
                toast('已应用，请记得发布', 'success');
            } catch (e) {
                toast('JSON 格式错误：' + e.message, 'error');
            }
        });
    }

    /* ------------------------------------------------------------------
     * Test lead delivery
     * ---------------------------------------------------------------- */
    function testCard() {
        var card = document.createElement('section');
        card.className = 'card';
        card.innerHTML =
            '<div class="card-head"><h3>测试发送</h3></div>' +
            '<p class="muted">使用当前「发送方式」发送一封测试线索到接收邮箱，确认配置生效。</p>' +
            '<div class="row-actions"><button class="btn btn-primary btn-sm" id="testSend">发送测试线索</button>' +
            '<span class="muted" id="testResult"></span></div>';

        setTimeout(function () {
            $('#testSend').addEventListener('click', function () {
                var btn = $('#testSend');
                var out = $('#testResult');
                btn.classList.add('is-loading');
                btn.disabled = true;
                out.textContent = '正在发送…';

                sendTest().then(function (msg) {
                    out.textContent = msg;
                    toast('测试发送成功', 'success');
                }).catch(function (err) {
                    out.textContent = '失败：' + err.message;
                    toast('测试发送失败：' + err.message, 'error');
                }).then(function () {
                    btn.classList.remove('is-loading');
                    btn.disabled = false;
                });
            });
        }, 0);

        return card;
    }

    function sendTest() {
        var s = state.config.leadSettings || {};
        var provider = s.provider || 'formsubmit';
        var payload = {
            name: 'TSJ Test Lead',
            phone: '+1 555 000 0000',
            country: 'United States',
            region: 'Test City',
            email: s.recipientEmail || '',
            interest: 'Kitchen cabinetry',
            message: 'This is a test lead from the admin panel.',
            source: 'admin-test',
            page: location.href,
            submittedAt: new Date().toLocaleString('en-GB')
        };
        var subject = 'New cabinetry enquiry — TEST';

        if (provider === 'none') return Promise.reject(new Error('发送方式为「关闭」'));

        if (provider === 'formsubmit') {
            if (!s.recipientEmail) return Promise.reject(new Error('未配置接收邮箱'));
            return postJSON('https://formsubmit.co/ajax/' + encodeURIComponent(s.recipientEmail), {
                _subject: subject,
                _template: 'table',
                _captcha: 'false',
                Name: payload.name,
                Phone: payload.phone,
                Country: payload.country,
                Email: payload.email,
                Source: 'admin-test'
            }).then(function (res) {
                var ok = res.json && (res.json.success === true || res.json.success === 'true');
                if (res.json && res.json.success !== undefined && !ok) {
                    throw new Error((res.json.message || 'FormSubmit 拒绝了请求') + '（首次使用请先在邮箱点击激活链接）');
                }
                return '已发送到 ' + s.recipientEmail;
            });
        }

        if (provider === 'emailjs') {
            if (!s.emailjsServiceId || !s.emailjsTemplateId || !s.emailjsPublicKey) {
                return Promise.reject(new Error('EmailJS 参数不完整'));
            }
            return postJSON('https://api.emailjs.com/api/v1.0/email/send', {
                service_id: s.emailjsServiceId,
                template_id: s.emailjsTemplateId,
                user_id: s.emailjsPublicKey,
                template_params: {
                    to_email: s.recipientEmail,
                    subject: subject,
                    name: payload.name,
                    phone: payload.phone,
                    country: payload.country,
                    email: payload.email,
                    message: payload.message,
                    source: 'admin-test'
                }
            }).then(function () { return '已通过 EmailJS 发送'; });
        }

        if (provider === 'web3forms') {
            if (!s.web3formsKey) return Promise.reject(new Error('未配置 Web3Forms Key'));
            return postJSON('https://api.web3forms.com/submit', {
                access_key: s.web3formsKey,
                subject: subject,
                name: payload.name,
                email: s.recipientEmail || 'test@example.com',
                message: JSON.stringify(payload, null, 2)
            }).then(function () { return '已通过 Web3Forms 发送'; });
        }

        if (provider === 'webhook') {
            if (!s.webhookUrl) return Promise.reject(new Error('未配置 Webhook 地址'));
            return postJSON(s.webhookUrl, payload).then(function () { return 'Webhook 已接收'; });
        }

        return Promise.reject(new Error('未知的发送方式'));
    }

    function postJSON(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(body)
        }).then(function (res) {
            return res.text().then(function (text) {
                var json = null;
                try { json = JSON.parse(text); } catch (e) { /* ignore */ }
                if (!res.ok) throw new Error((json && json.message) || text || ('HTTP ' + res.status));
                return { json: json, text: text };
            });
        });
    }

    /* ------------------------------------------------------------------
     * Init
     * ---------------------------------------------------------------- */
    window.addEventListener('beforeunload', function (e) {
        if (!state.dirty) return;
        e.preventDefault();
        e.returnValue = '';
    });

    document.addEventListener('DOMContentLoaded', initLogin);
})();
