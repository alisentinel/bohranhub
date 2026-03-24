<?php
/**
 * BohranHub - Crisis-Resilient Website
 * https://bohranhub.ir
 * Inline CSS/JS with server-side rendering
 */

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Cache-Control: public, max-age=3600');
header('Content-Type: text/html; charset=UTF-8');

// Load data from data.json
$errorPage = '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>خطا - بحران‌هاب</title><style>body{font-family:Tahoma,Arial,sans-serif;background:#f5f5f0;color:#1a1a1a;padding:20px;text-align:center}h1{color:#d32f2f;font-size:2rem;margin:40px 0 20px}p{font-size:1.1rem;margin:10px 0}</style></head><body><h1>⚠️ خطای بارگذاری داده</h1><p>فایل data.json یافت نشد یا خراب است.</p><p>لطفاً با مدیر سیستم تماس بگیرید.</p></body></html>';
$jsonContent = @file_get_contents(__DIR__ . '/data.json');
if ($jsonContent === false) {
    die($errorPage);
}
$data = json_decode($jsonContent, true);
if ($data === null || !isset($data['site']) || !isset($data['tags']) || !isset($data['tiles'])) {
    die($errorPage);
}
$site = $data['site'];
$tags = $data['tags'];
$tiles = $data['tiles'];

// Helper: allow only harmless HTML tags in text content
function safeTags($text)
{
    // Temporarily protect <warning> tags from strip_tags
    $text = preg_replace('/<warning>/i', '%%WARNING_OPEN%%', $text);
    $text = preg_replace('/<\/warning>/i', '%%WARNING_CLOSE%%', $text);
    $text = strip_tags($text, '<b><i><strong><em><u><ul><ol><li><br><p><span><sub><sup><mark><small><del><ins><hr><code>');
    // Restore as styled <b>
    $text = str_replace('%%WARNING_OPEN%%', '<b class="warning">', $text);
    $text = str_replace('%%WARNING_CLOSE%%', '</b>', $text);
    return $text;
}

// Helper to get tag label
function getTagLabel($tags, $id)
{
    foreach ($tags as $tag) {
        if ($tag['id'] === $id) return $tag['label'];
    }
    return $id;
}

// Helper to render checklist items (recursive for nested items)
function renderChecklistItems($items, $parentId = '')
{
    foreach ($items as $index => $item) {
        $itemId = $parentId ? $parentId . '-' . $index : 'check-' . $index;
        $hasChildren = !empty($item['children']);
        ?>
        <li class="checklist-item" data-item-id="<?= htmlspecialchars($itemId) ?>">
            <div class="checklist-item-content">
                <label class="checklist-label">
                    <input type="checkbox" class="checklist-checkbox" data-item-id="<?= htmlspecialchars($itemId) ?>">
                    <span class="checklist-text"><?= safeTags($item['text']) ?></span>
                </label>
                <button class="checklist-hide-btn" data-item-id="<?= htmlspecialchars($itemId) ?>" title="مخفی کردن"
                    aria-label="مخفی کردن این آیتم">×</button>
            </div>
            <?php if (!empty($item['description'])): ?>
                <div class="checklist-description"><?= safeTags($item['description']) ?></div>
            <?php endif; ?>
            <?php if ($hasChildren): ?>
                <details>
                    <summary class="checklist-summary">
                        <span class="arrow-icon">◀</span> شامل <?= count($item['children']) ?> زیرمجموعه
                    </summary>
                    <ul class="checklist-nested">
                        <?php renderChecklistItems($item['children'], $itemId); ?>
                        <li class="checklist-restore-item" style="display:none;"><button class="checklist-restore-btn">بازگرداندن
                                آیتم(های) مخفی‌شده</button></li>
                    </ul>
                </details>
            <?php endif; ?>
        </li>
        <?php
    }
}

// Helper to render a tile (recursive for nested tiles)
function renderTile($tile, $tags, $depth = 0)
{
    $hasChildren = !empty($tile['children']);
    $hasLinks = !empty($tile['links']);
    $hasChecklist = !empty($tile['checklist']);
    $indentClass = $depth > 0 ? ' tile-nested tile-depth-' . $depth : '';
    ?>
    <article class="tile<?= $indentClass ?>"
        data-tags="<?php if (isset($tile['tags']) && is_array($tile['tags'])): ?><?= implode(',', $tile['tags']) ?><?php else: ?>none<?php endif; ?>"
        role="article" aria-labelledby="tile-<?= md5($tile['title']) ?>">
        <h3><?= !empty($tile['icon']) ? $tile['icon'] . '     ' : '' ?><?= safeTags($tile['title']) ?></h3>
        <?php if (!empty($tile['description'])): ?>
            <p><?= safeTags($tile['description']) ?></p>
        <?php endif; ?>
        <?php if (isset($tile['tags']) && in_array('cities', $tile['tags']) && $depth === 0): ?>
            <div class="search-container">
                <input type="text" id="city-search" class="search-input" placeholder="نام شهر را وارد کنید..."
                    aria-label="جستجوی شهر">
                <p id="city-search-result" class="search-result"></p>
            </div>
        <?php endif; ?>

        <?php if ($hasLinks): ?>
            <details <?= $hasChildren ? '' : '' ?>>
                <summary><span class="arrow-icon">◀</span> <?= count($tile['links']) ?> مورد</summary>
                <ul class="links">
                    <?php foreach ($tile['links'] as $link): ?>
                        <li>
                            <?php if ($link['url']): ?>
                                <a href="<?= htmlspecialchars($link['url']) ?>" target="_blank" rel="noopener">
                                    <?= safeTags($link['text']) ?>
                                </a>
                            <?php else: ?>
                                <strong><?= safeTags($link['text']) ?></strong>
                            <?php endif; ?>
                            <?php if (!empty($link['description'])): ?>
                                <p class="link-description"><?= safeTags($link['description']) ?></p>
                            <?php endif; ?>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </details>
        <?php endif; ?>

        <?php if ($hasChecklist): ?>
            <details>
                <summary><span class="arrow-icon">◀</span> <?= count($tile['checklist']) ?> آیتم چک‌لیست</summary>
                <ul class="checklist">
                    <?php renderChecklistItems($tile['checklist']); ?>
                    <li class="checklist-restore-item" style="display:none;"><button class="checklist-restore-btn">بازگرداندن
                            آیتم(های) مخفی‌شده</button></li>
                </ul>
            </details>
        <?php endif; ?>

        <?php if ($hasChildren): ?>
            <details class="children-container">
                <summary>
                    <span class="arrow-icon">◀</span> 
                    <?= count($tile['children']) ?>
                    <?php
                        if (isset($tile['tags']) && in_array('cities', $tile['tags']) && $depth === 0) {
                            echo " شهر";
                        } else {
                            echo " مورد";
                        }
                    ?>
                </summary>
                <div class="nested-tiles">
                    <?php foreach ($tile['children'] as $child): ?>
                        <?php renderTile($child, $tags, $depth + 1); ?>
                    <?php endforeach; ?>
                </div>
            </details>
        <?php endif; ?>

        <?php if (isset($tile['tags']) && is_array($tile['tags'])) { ?>
            <div class="tile-tags">
                <?php foreach ($tile['tags'] as $tagId): ?>
                    <span class="tile-tag">#<?= htmlspecialchars(getTagLabel($tags, $tagId)) ?></span>
                <?php endforeach; ?>
            </div>
        <?php } ?>
    </article>
    <?php
}

// Start output buffering with gzip compression
ob_start('ob_gzhandler');
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= htmlspecialchars($site['description']) ?>">
    <meta name="theme-color" content="#1a1a1a">
    <title><?= htmlspecialchars($site['title']) ?></title>
    <style>
        <?php
        $css = file_get_contents(__DIR__ . '/style.css');
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        $css = preg_replace('/\s+/', ' ', $css);
        $css = preg_replace('/\s*([{}:;,])\s*/', '$1', $css);
        echo $css;
        ?>
    </style>
</head>

<body>
    <header role="banner">
        <div class="container">
            <h1><?= htmlspecialchars($site['header']) ?></h1>
            <p class="subtitle"><?= htmlspecialchars($site['subtitle']) ?></p>
        </div>
    </header>
    <nav role="navigation" aria-label="منوی اصلی">
        <div class="container">
            <a href="/" class="active" aria-current="page">خانه</a>
            <?php /* <a href="#about">درباره ما</a>
<a href="#contact">تماس</a> */ ?>

            <a href="<?= htmlspecialchars($site['github']) ?>" target="_blank" rel="noopener">GitHub ↗</a>
        </div>
    </nav>
    <main role="main" class="container">
        <section id="introduction" class="section" aria-labelledby="intro-heading">
            <h2>خوش آمدید به بحران‌هاب</h2>

            <p>در اینجا می‌توانید منابع اضطراری را بر اساس برچسب‌ها فیلتر کنید تا سریع‌تر به اطلاعات مورد نیاز خود
                دسترسی پیدا کنید.</p>
            <h4>
                رفع مسئولیت:</h4>
            <ul>
                <li>ما محتوای معرفی‌شده در وب‌سایت‌ها را <b>تأیید نمی‌کنیم</b>.</li>
                <li>امیدواریم هرگز نیازی به استفاده از این منابع نداشته باشید. ❤️</li>
                <li>معرفی سایت به معنای تأیید محتوا یا خدمات یا تأیید سیاست‌های آن‌ها <b>نیست</b>.</li>
                <li>- ما با هرگونه محدودیت و سانسور در بستر اینترنت بین‌الملل <b>مخالف</b> هستیم؛ این وبسایت هیچگونه
                    تسهیل‌گری در جایگزینی سرویس‌های بین‌الملل نمی‌کند.</li>
            </ul>
            <br>
            <h4>نماد ها</h2>
                <ul>
                    <li>پرچم = وب‌سایت‌های دولتی یا با پشتوانه دولت پرچم رسمی همان کشور</li>

                    <li>🌎 = وب‌سایت‌های بین‌المللی</li>
                    <li>🤝 = پروژه‌های اوپن‌سورس</li>
                    <li>📕 = کتابچه (معمولاً PDF)</li>

                    <li>📱 = اپلیکیشن موبایل</li>

                    <li>✅ = وبسایت‌های ساخته یا تأیید شده توسط تیم بحران‌هاب</li>
                </ul>

                <br>
                <h4>برای افزودن منابع جدید یا طرح مشکلات از طریق گیت‌هاب یا تلگرام اقدام کنید:</h4>
                <ul>
                    <li>گیت‌هاب: <a href="<?= htmlspecialchars($site['github']) ?>" target="_blank"
                            rel="noopener"><?= htmlspecialchars($site['github']) ?> ↗</a></li>
                    <li>تلگرام: <a href="https://t.me/imSentinel" target="_blank" rel="noopener">https://t.me/imSentinel
                            ↗</a></li>
                </ul>
        </section>
        <section id="tags" class="section" aria-label="فیلتر برچسب‌ها">
            <h2>فیلتر بر اساس برچسب:</h2>
            <div class="tags-list" role="group" aria-label="دکمه‌های فیلتر">
                <?php foreach ($tags as $tag): ?>
                    <button class="tag<?= $tag['id'] === 'all' ? ' active' : '' ?>" data-tag="<?= $tag['id'] ?>"
                        aria-pressed="<?= $tag['id'] === 'all' ? 'true' : 'false' ?>">#<?= htmlspecialchars($tag['label']) ?></button>
                <?php endforeach; ?>
            </div>
        </section>
        <section id="tiles" class="tiles-section" aria-label="کارت‌های اطلاعاتی">
            <?php foreach ($tiles as $tile): ?>
                <?php renderTile($tile, $tags); ?>
            <?php endforeach; ?>
        </section>
        <section id="about" class="section" aria-labelledby="about-heading">
            <h2 id="about-heading">درباره بحران‌هاب</h2>
            <p>بحران‌هاب یک منبع اطلاعاتی غیرانتفاعی برای دسترسی سریع به منابع اضطراری در شرایط بحران است. این وب‌سایت
                برای کار روی دستگاه‌های قدیمی و اتصالات کُند طراحی شده است.</p>
        </section>
        <?php /*
<section id="contact" class="section" aria-labelledby="contact-heading">
<h2 id="contact-heading">تماس با ما</h2>
<p>برای پیشنهادات و گزارش مشکلات:</p>
<p><strong>ایمیل:</strong> <?= htmlspecialchars($site['email']) ?></p>
</section> */ ?>
    </main>
    <footer role="contentinfo">
        <div class="container">
            <p>بحران‌هاب © ۱۴۰۴ - منبع باز و رایگان برای همه</p>
            <p class="small">این سایت برای کار در شرایط سخت و اتصالات ضعیف بهینه شده است.</p>
            <p class="small">مجوز: <a href=" <?= htmlspecialchars($site['github']) ?>/blob/main/LICENSE"
                    target="_blank" rel="noopener">AGPL-3.0</a> - کد منبع در <a
                    href="<?= htmlspecialchars($site['github']) ?>" target="_blank" rel="noopener">GitHub</a></p>
        </div>
    </footer>
    <script><?php
    $js = file_get_contents(__DIR__ . '/script.js');
    $js = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $js);
    $js = preg_replace('/\/\/.*$/m', '', $js);
    $js = str_replace(["\r\n", "\r", "\n", "\t"], '', $js);
    $js = preg_replace('/\s+/', ' ', $js);
    $js = preg_replace('/\s*([{}();,:])\s*/', '$1', $js);
    echo $js;
    ?></script>
</body>

</html>
<?php
// Get buffered content and minify HTML
$html = ob_get_clean();
// Remove comments
$html = preg_replace('/<!--(.|\s)*?-->/', '', $html);
// Minify whitespace and new lines
$html = preg_replace('/\s+/', ' ', $html);
$html = preg_replace('/>\s+</', '><', $html);
echo $html;
