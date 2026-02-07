// BohranHub - Tag Filtering (Content rendered server-side)
(function () {
    'use strict';

    var tags = document.querySelectorAll('.tag[data-tag]');
    var tiles = document.querySelectorAll('.tile[data-tags]');

    if (!tags.length || !tiles.length) return;

    function filter(tag) {
        var i, t, tileTags, hasVisibleChild;
        for (i = 0; i < tiles.length; i++) {
            t = tiles[i];
            tileTags = t.getAttribute('data-tags') || '';

            // Check if this tile matches the filter
            var matches = tag === 'all' || tileTags.indexOf(tag) !== -1;

            // For nested tiles, check if any child is visible
            if (!matches && t.querySelector('.tile-nested')) {
                hasVisibleChild = false;
                var nestedTiles = t.querySelectorAll('.tile-nested[data-tags]');
                for (var j = 0; j < nestedTiles.length; j++) {
                    var nestedTags = nestedTiles[j].getAttribute('data-tags') || '';
                    if (tag === 'all' || nestedTags.indexOf(tag) !== -1) {
                        hasVisibleChild = true;
                        nestedTiles[j].classList.remove('hidden');
                    } else {
                        nestedTiles[j].classList.add('hidden');
                    }
                }
                // Show parent if any child is visible
                if (hasVisibleChild) {
                    t.classList.remove('hidden');
                } else {
                    t.classList.add('hidden');
                }
            } else {
                // Regular tile (no children) or matches itself
                if (matches) {
                    t.classList.remove('hidden');
                    // Show all children if parent matches
                    var childTiles = t.querySelectorAll('.tile-nested');
                    for (var k = 0; k < childTiles.length; k++) {
                        childTiles[k].classList.remove('hidden');
                    }
                } else {
                    t.classList.add('hidden');
                }
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

    // Initialize search within cities tile
    var searchInput = document.getElementById('city-search');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            var query = e.target.value.trim().toLowerCase();
            searchCities(query);
        });
    }

    function searchCities(query) {
        var searchInput = document.getElementById('city-search');
        if (!searchInput) return;

        var resultElement = document.getElementById('city-search-result');

        // Find the parent tile that contains the search input
        var parentTile = searchInput.closest('.tile');
        if (!parentTile) return;

        // Find the children-container details element
        var childrenDetails = parentTile.querySelector('.children-container');

        // Get all nested tiles within this parent
        var nestedTiles = parentTile.querySelectorAll('.tile-nested');

        // If empty query, show all nested tiles and clear result
        if (!query) {
            for (var i = 0; i < nestedTiles.length; i++) {
                nestedTiles[i].classList.remove('hidden');
            }
            if (resultElement) resultElement.textContent = '';
            return;
        }

        // Open the details element to show cities
        if (childrenDetails) {
            childrenDetails.open = true;
        }

        // Filter nested tiles based on query and count visible ones
        var visibleCount = 0;
        for (var j = 0; j < nestedTiles.length; j++) {
            var nestedTitle = nestedTiles[j].querySelector('h3');
            if (nestedTitle) {
                var titleText = nestedTitle.textContent.toLowerCase();
                if (titleText.indexOf(query) !== -1) {
                    nestedTiles[j].classList.remove('hidden');
                    visibleCount++;
                } else {
                    nestedTiles[j].classList.add('hidden');
                }
            }
        }

        // Update result message
        if (resultElement) {
            if (visibleCount === 0) {
                resultElement.textContent = 'شهری یافت نشد';
            } else {
                resultElement.textContent = visibleCount + ' شهر یافت شد';
            }
        }
    }
})();

// BohranHub - Checklist State Management (Cookie-based)
(function () {
    'use strict';

    var COOKIE_NAME = 'bohranhub_checklist';
    var COOKIE_NAME_HIDDEN = 'bohranhub_checklist_hidden';
    var COOKIE_EXPIRY_DAYS = 365;

    // Cookie utilities
    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    function getCookie(name) {
        var nameEQ = name + '=';
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Get all checked items from cookie
    function getCheckedItems() {
        var cookie = getCookie(COOKIE_NAME);
        if (!cookie) return {};
        try {
            return JSON.parse(decodeURIComponent(cookie));
        } catch (e) {
            return {};
        }
    }

    // Save checked items to cookie
    function saveCheckedItems(checkedItems) {
        var value = encodeURIComponent(JSON.stringify(checkedItems));
        setCookie(COOKIE_NAME, value, COOKIE_EXPIRY_DAYS);
    }

    // Get all hidden items from cookie
    function getHiddenItems() {
        var cookie = getCookie(COOKIE_NAME_HIDDEN);
        if (!cookie) return {};
        try {
            return JSON.parse(decodeURIComponent(cookie));
        } catch (e) {
            return {};
        }
    }

    // Save hidden items to cookie
    function saveHiddenItems(hiddenItems) {
        var value = encodeURIComponent(JSON.stringify(hiddenItems));
        setCookie(COOKIE_NAME_HIDDEN, value, COOKIE_EXPIRY_DAYS);
    }

    // Update visibility of restore buttons per list
    function updateRestoreButtons() {
        var restoreBtns = document.querySelectorAll('.checklist-restore-item');
        var hiddenItems = getHiddenItems();

        for (var i = 0; i < restoreBtns.length; i++) {
            var restoreItem = restoreBtns[i];
            var parentList = restoreItem.parentElement;
            if (!parentList) continue;

            // Check if this specific list has any hidden direct children
            var hasHidden = false;
            var directItems = parentList.querySelectorAll(':scope > .checklist-item[data-item-id]');
            for (var j = 0; j < directItems.length; j++) {
                if (directItems[j].classList.contains('item-hidden')) {
                    hasHidden = true;
                    break;
                }
            }
            restoreItem.style.display = hasHidden ? 'list-item' : 'none';
        }
    }

    // Get all child checkboxes of a given checkbox
    function getChildCheckboxes(checkbox) {
        var children = [];
        var listItem = checkbox.closest('.checklist-item');
        if (!listItem) return children;

        var nestedList = listItem.querySelector('.checklist-nested');
        if (nestedList) {
            var childBoxes = nestedList.querySelectorAll('.checklist-checkbox');
            for (var i = 0; i < childBoxes.length; i++) {
                children.push(childBoxes[i]);
            }
        }
        return children;
    }

    // Get parent checkbox of a given checkbox
    function getParentCheckbox(checkbox) {
        var listItem = checkbox.closest('.checklist-item');
        if (!listItem) return null;

        var nestedList = listItem.parentElement;
        if (!nestedList || !nestedList.classList.contains('checklist-nested')) return null;

        var parentItem = nestedList.closest('.checklist-item');
        if (!parentItem) return null;

        return parentItem.querySelector(':scope > .checklist-item-content > .checklist-label > .checklist-checkbox');
    }

    // Get all sibling checkboxes (including self)
    function getSiblingCheckboxes(checkbox) {
        var siblings = [];
        var listItem = checkbox.closest('.checklist-item');
        if (!listItem) return siblings;

        var parentList = listItem.parentElement;
        if (!parentList) return siblings;

        var items = parentList.querySelectorAll(':scope > .checklist-item');
        for (var i = 0; i < items.length; i++) {
            var cb = items[i].querySelector(':scope > .checklist-item-content > .checklist-label > .checklist-checkbox');
            if (cb) siblings.push(cb);
        }
        return siblings;
    }

    // Update checkbox and all its children
    function updateCheckboxAndChildren(checkbox, checked, items) {
        var id = checkbox.getAttribute('data-item-id');

        if (checked) {
            items[id] = true;
            checkbox.checked = true;
            checkbox.parentElement.classList.add('checked');
        } else {
            delete items[id];
            checkbox.checked = false;
            checkbox.parentElement.classList.remove('checked');
        }

        // Update all children (skip hidden ones)
        var children = getChildCheckboxes(checkbox);
        for (var i = 0; i < children.length; i++) {
            var childItem = children[i].closest('.checklist-item');
            // Skip hidden items
            if (childItem && childItem.classList.contains('item-hidden')) {
                continue;
            }
            updateCheckboxAndChildren(children[i], checked, items);
        }
    }

    // Update parent based on children state
    function updateParent(checkbox, items) {
        var parent = getParentCheckbox(checkbox);
        if (!parent) return;

        var siblings = getSiblingCheckboxes(checkbox);
        var allChecked = true;
        var hasVisibleSiblings = false;

        for (var i = 0; i < siblings.length; i++) {
            var siblingItem = siblings[i].closest('.checklist-item');
            // Skip hidden items
            if (siblingItem && siblingItem.classList.contains('item-hidden')) {
                continue;
            }
            hasVisibleSiblings = true;
            if (!siblings[i].checked) {
                allChecked = false;
                break;
            }
        }

        var parentId = parent.getAttribute('data-item-id');
        // Only check parent if there are visible siblings and all are checked
        if (hasVisibleSiblings && allChecked) {
            items[parentId] = true;
            parent.checked = true;
            parent.parentElement.classList.add('checked');
        } else {
            delete items[parentId];
            parent.checked = false;
            parent.parentElement.classList.remove('checked');
        }

        // Recursively update grandparent
        updateParent(parent, items);
    }

    // Initialize checkboxes
    function initCheckboxes() {
        var checkboxes = document.querySelectorAll('.checklist-checkbox');
        if (!checkboxes.length) return;

        var checkedItems = getCheckedItems();
        var hiddenItems = getHiddenItems();

        // Restore checked states
        for (var i = 0; i < checkboxes.length; i++) {
            var checkbox = checkboxes[i];
            var itemId = checkbox.getAttribute('data-item-id');
            if (checkedItems[itemId]) {
                checkbox.checked = true;
                checkbox.parentElement.classList.add('checked');
            }

            // Add change listener
            checkbox.addEventListener('change', function (e) {
                var cb = e.target;
                var items = getCheckedItems();

                // Update checkbox and all its children
                updateCheckboxAndChildren(cb, cb.checked, items);

                // Update parent if all siblings are checked
                updateParent(cb, items);

                saveCheckedItems(items);
            });
        }

        // Restore hidden states
        var allItems = document.querySelectorAll('.checklist-item[data-item-id]');
        for (var j = 0; j < allItems.length; j++) {
            var item = allItems[j];
            var itemId = item.getAttribute('data-item-id');
            if (hiddenItems[itemId]) {
                item.classList.add('item-hidden');
            }
        }

        // Add hide button listeners
        var hideBtns = document.querySelectorAll('.checklist-hide-btn');
        for (var k = 0; k < hideBtns.length; k++) {
            hideBtns[k].addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var btn = e.target;
                var itemId = btn.getAttribute('data-item-id');
                var item = document.querySelector('.checklist-item[data-item-id="' + itemId + '"]');

                if (item) {
                    var hidden = getHiddenItems();
                    hidden[itemId] = true;
                    saveHiddenItems(hidden);
                    item.classList.add('item-hidden');
                    updateRestoreButtons();

                    // Update parent checkbox state after hiding
                    var checkbox = item.querySelector(':scope > .checklist-item-content > .checklist-label > .checklist-checkbox');
                    if (checkbox) {
                        var items = getCheckedItems();
                        updateParent(checkbox, items);
                        saveCheckedItems(items);
                    }
                }
            });
        }

        // Add restore button listeners
        var restoreBtns = document.querySelectorAll('.checklist-restore-btn');
        for (var m = 0; m < restoreBtns.length; m++) {
            restoreBtns[m].addEventListener('click', function (e) {
                e.preventDefault();
                var restoreItem = e.target.closest('.checklist-restore-item');
                var parentList = restoreItem ? restoreItem.parentElement : null;
                if (!parentList) return;

                var hidden = getHiddenItems();

                // Only restore items in this specific list
                var directItems = parentList.querySelectorAll(':scope > .checklist-item.item-hidden');
                for (var n = 0; n < directItems.length; n++) {
                    var itemId = directItems[n].getAttribute('data-item-id');
                    delete hidden[itemId];
                    directItems[n].classList.remove('item-hidden');
                }

                saveHiddenItems(hidden);
                updateRestoreButtons();

                // Update parent checkbox states after restoring
                var checkedItems = getCheckedItems();
                var listCheckboxes = parentList.querySelectorAll(':scope > .checklist-item .checklist-checkbox');
                for (var p = 0; p < listCheckboxes.length; p++) {
                    var cb = listCheckboxes[p];
                    var parentCb = getParentCheckbox(cb);
                    if (parentCb) {
                        updateParent(cb, checkedItems);
                    }
                }
                saveCheckedItems(checkedItems);
            });
        }

        // Update restore button visibility
        updateRestoreButtons();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCheckboxes);
    } else {
        initCheckboxes();
    }
})();

// Arrow toggle for details/summary elements
(function () {
    'use strict';
    var ARROWS = { '\u25C0': '\u25BC', '\u25BC': '\u25C0' };
    var details = document.querySelectorAll('details');
    for (var i = 0; i < details.length; i++) {
        details[i].addEventListener('toggle', function () {
            var arrow = this.querySelector('summary .arrow-icon');
            if (arrow && ARROWS[arrow.textContent]) {
                arrow.textContent = ARROWS[arrow.textContent];
            }
        });
    }
})();
