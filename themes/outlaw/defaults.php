<?php
declare(strict_types=1);

/** Source offer for the exact installed Outlaw release. */
class OC_Theme {
    private string $sourceUrl;

    public function __construct() {
        $this->sourceUrl = '/source/' . rawurlencode(basename(realpath(\OC::$SERVERROOT))) . '/';
        \OCP\Util::addHeader('link', [
            'id' => 'outlaw-source-offer', 'rel' => 'alternate',
            'title' => 'Source code', 'href' => $this->sourceUrl,
        ]);
        \OCP\Util::addScript('core', 'outlaw-source');
        \OCP\Util::addStyle('core', 'outlaw-source');
    }

    public function getLongFooter(): string {
        return 'Nextcloud · <a class="outlaw-source-offer" href="' . $this->sourceUrl
            . '" target="_blank" rel="noopener noreferrer">Source code for this installation</a>';
    }
}
