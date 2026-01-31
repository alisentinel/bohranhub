// BohranHub - Tag Filtering (Content rendered server-side)
(function () {
    'use strict';

    var tags = document.querySelectorAll('.tag[data-tag]');
    var tiles = document.querySelectorAll('.tile[data-tags]');

    if (!tags.length || !tiles.length) return;

    function filter(tag) {
        var i, t, tileTags;
        for (i = 0; i < tiles.length; i++) {
            t = tiles[i];
            tileTags = t.getAttribute('data-tags') || '';
            if (tag === 'all' || tileTags.indexOf(tag) !== -1) {
                t.classList.remove('hidden');
            } else {
                t.classList.add('hidden');
            }
        }
    }

    function setActive(btn) {
        for (var i = 0; i < tags.length; i++) {
            tags[i].classList.remove('active');
        }
        btn.classList.add('active');
    }

    function handleClick(e) {
        var btn = e.target;
        if (!btn.classList.contains('tag')) return;
        var tag = btn.getAttribute('data-tag');
        if (tag) {
            setActive(btn);
            filter(tag);
        }
    }

    // Event delegation for better performance
    var tagsList = document.querySelector('.tags-list');
    if (tagsList) {
        tagsList.addEventListener('click', handleClick);
    }
})();
