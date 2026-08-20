// BohranHub - client-side rendering of data.json (static hosting: no PHP)
(function () {
    'use strict';

    var ALLOWED = 'B I STRONG EM U UL OL LI BR P SPAN SUB SUP MARK SMALL DEL INS HR CODE'.split(' ');

    function esc(text) {
        var d = document.createElement('div');
        d.textContent = text == null ? '' : text;
        return d.innerHTML;
    }

    // Port of PHP safeTags(): keep harmless tags, drop everything else, <warning> -> <b class="warning">
    function safeTags(text) {
        var html = String(text == null ? '' : text)
            .replace(/<warning>/gi, '<b class="warning">')
            .replace(/<\/warning>/gi, '</b>');
        var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
        var root = doc.body.firstChild;
        var els = root.querySelectorAll('*');
        for (var i = els.length - 1; i >= 0; i--) {
            var el = els[i];
            for (var j = el.attributes.length - 1; j >= 0; j--) {
                if (el.attributes[j].name !== 'class') el.removeAttribute(el.attributes[j].name);
            }
            if (ALLOWED.indexOf(el.tagName) === -1) {
                while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                el.parentNode.removeChild(el);
            }
        }
        return root.innerHTML;
    }

    function tagLabel(tags, id) {
        for (var i = 0; i < tags.length; i++) if (tags[i].id === id) return tags[i].label;
        return id;
    }

    function renderChecklistItems(items, parentId) {
        var out = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var id = parentId ? parentId + '-' + i : 'check-' + i;
            out += '<li class="checklist-item" data-item-id="' + esc(id) + '">' +
                '<div class="checklist-item-content"><label class="checklist-label">' +
                '<input type="checkbox" class="checklist-checkbox" data-item-id="' + esc(id) + '">' +
                '<span class="checklist-text">' + safeTags(item.text) + '</span></label>' +
                '<button class="checklist-hide-btn" data-item-id="' + esc(id) + '" title="مخفی کردن" aria-label="مخفی کردن این آیتم">×</button></div>';
            if (item.description) out += '<div class="checklist-description">' + safeTags(item.description) + '</div>';
            if (item.children && item.children.length) {
                out += '<details><summary class="checklist-summary"><span class="arrow-icon">◀</span> شامل ' +
                    item.children.length + ' زیرمجموعه</summary><ul class="checklist-nested">' +
                    renderChecklistItems(item.children, id) + restoreItem() + '</ul></details>';
            }
            out += '</li>';
        }
        return out;
    }

    function restoreItem() {
        return '<li class="checklist-restore-item" style="display:none;"><button class="checklist-restore-btn">بازگرداندن آیتم(های) مخفی‌شده</button></li>';
    }

    function renderTile(tile, tags, depth) {
        depth = depth || 0;
        var tileTags = Array.isArray(tile.tags) ? tile.tags : null;
        var isCities = tileTags && tileTags.indexOf('cities') !== -1 && depth === 0;
        var out = '<article class="tile' + (depth > 0 ? ' tile-nested tile-depth-' + depth : '') +
            '" data-tags="' + esc(tileTags ? tileTags.join(',') : 'none') + '" role="article">' +
            '<h3>' + (tile.icon ? esc(tile.icon) + '     ' : '') + safeTags(tile.title) + '</h3>';
        if (tile.description) out += '<p>' + safeTags(tile.description) + '</p>';
        if (isCities) {
            out += '<div class="search-container"><input type="text" id="city-search" class="search-input" ' +
                'placeholder="نام شهر را وارد کنید..." aria-label="جستجوی شهر">' +
                '<p id="city-search-result" class="search-result"></p></div>';
        }
        if (tile.links && tile.links.length) {
            out += '<details><summary><span class="arrow-icon">◀</span> ' + tile.links.length + ' مورد</summary><ul class="links">';
            for (var i = 0; i < tile.links.length; i++) {
                var link = tile.links[i];
                out += '<li>' + (link.url
                    ? '<a href="' + esc(link.url) + '" target="_blank" rel="noopener">' + safeTags(link.text) + '</a>'
                    : '<strong>' + safeTags(link.text) + '</strong>');
                if (link.description) out += '<p class="link-description">' + safeTags(link.description) + '</p>';
                out += '</li>';
            }
            out += '</ul></details>';
        }
        if (tile.checklist && tile.checklist.length) {
            out += '<details><summary><span class="arrow-icon">◀</span> ' + tile.checklist.length +
                ' آیتم چک‌لیست</summary><ul class="checklist">' +
                renderChecklistItems(tile.checklist, '') + restoreItem() + '</ul></details>';
        }
        if (tile.children && tile.children.length) {
            out += '<details class="children-container"><summary><span class="arrow-icon">◀</span> ' +
                tile.children.length + (isCities ? ' شهر' : ' مورد') + '</summary><div class="nested-tiles">';
            for (var j = 0; j < tile.children.length; j++) out += renderTile(tile.children[j], tags, depth + 1);
            out += '</div></details>';
        }
        if (tileTags) {
            out += '<div class="tile-tags">';
            for (var k = 0; k < tileTags.length; k++) out += '<span class="tile-tag">#' + esc(tagLabel(tags, tileTags[k])) + '</span>';
            out += '</div>';
        }
        return out + '</article>';
    }

    function setMeta(selector, content) {
        var el = document.querySelector(selector);
        if (el) el.setAttribute('content', content);
    }

    function render(data) {
        var site = data.site, tags = data.tags, tiles = data.tiles;
        document.title = site.title;
        document.getElementById('site-header').textContent = site.header;
        document.getElementById('site-subtitle').textContent = site.subtitle;
        setMeta('meta[name="description"]', site.description);
        setMeta('meta[property="og:description"]', site.description);
        setMeta('meta[name="twitter:description"]', site.description);
        setMeta('meta[property="og:title"]', site.title);
        setMeta('meta[name="twitter:title"]', site.title);
        document.getElementById('nav-github').href = site.github;
        var introGh = document.getElementById('intro-github');
        introGh.href = site.github;
        introGh.textContent = site.github + ' ↗';
        document.getElementById('footer-github').href = site.github;
        document.getElementById('footer-license').href = site.github + '/blob/main/LICENSE';

        var tagsHtml = '';
        for (var i = 0; i < tags.length; i++) {
            var active = tags[i].id === 'all';
            tagsHtml += '<button class="tag' + (active ? ' active' : '') + '" data-tag="' + esc(tags[i].id) +
                '" aria-pressed="' + active + '">#' + esc(tags[i].label) + '</button>';
        }
        document.querySelector('.tags-list').innerHTML = tagsHtml;

        var tilesHtml = '';
        for (var j = 0; j < tiles.length; j++) tilesHtml += renderTile(tiles[j], tags, 0);
        document.getElementById('tiles').innerHTML = tilesHtml;

        // script.js queries the DOM at load time, so load it only after rendering
        var s = document.createElement('script');
        s.src = 'script.js';
        document.body.appendChild(s);
    }

    fetch('data.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data || !data.site || !data.tags || !data.tiles) throw new Error('bad data');
            render(data);
        })
        .catch(function () {
            document.getElementById('tiles').innerHTML =
                '<article class="tile"><h3>⚠️ خطای بارگذاری داده</h3><p>فایل data.json یافت نشد یا خراب است.</p></article>';
        });
})();
