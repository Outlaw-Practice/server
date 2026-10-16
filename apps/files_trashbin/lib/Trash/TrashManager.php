<?php

/**
 * SPDX-FileCopyrightText: 2018 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Files_Trashbin\Trash;

use OCP\Files\Storage\IStorage;
use OCP\IUser;
use OCP\Lock\LockedException;

class TrashManager implements ITrashManager {
	/** @var ITrashBackend[] */
	private $backends = [];

	private $trashPaused = false;
	/** @var resource|null Shared by manager instances in this PHP process. */
	private static $mutationLock = null;

	#[\Override]
	public function withMutationLock(callable $operation): mixed {
		// A directory and any descendant must share the same lock, including
		// Teamfolders accessed through different users. The single-host deployment
		// shares its local config dataset between PHP and CLI workers. Never unlink
		// this file: replacing its inode would create a second lock domain.
		if (self::$mutationLock !== null) {
			return $operation();
		}
		$mask = umask(0077);
		try {
			$handle = fopen(\OC::$configDir . '/.retention-mutation.lock', 'c');
		} finally {
			umask($mask);
		}
		if ($handle === false) {
			throw new \RuntimeException('Trash mutation lock unavailable');
		}
		if (!flock($handle, LOCK_EX | LOCK_NB)) {
			fclose($handle);
			throw new LockedException('files_trashbin:mutation');
		}
		self::$mutationLock = $handle;
		try {
			return $operation();
		} finally {
			self::$mutationLock = null;
			flock($handle, LOCK_UN);
			fclose($handle);
		}
	}

	#[\Override]
	public function registerBackend(string $storageType, ITrashBackend $backend) {
		$this->backends[$storageType] = $backend;
	}

	/**
	 * @return ITrashBackend[]
	 */
	private function getBackends(): array {
		return $this->backends;
	}

	#[\Override]
	public function listTrashRoot(IUser $user): array {
		$items = array_reduce($this->getBackends(), function (array $items, ITrashBackend $backend) use ($user) {
			return array_merge($items, $backend->listTrashRoot($user));
		}, []);
		usort($items, function (ITrashItem $a, ITrashItem $b) {
			return $b->getDeletedTime() - $a->getDeletedTime();
		});
		return $items;
	}

	#[\Override]
	public function getTrashRootItem(IUser $user, string $name): ?ITrashItem {
		foreach ($this->getBackends() as $backend) {
			if (method_exists($backend, 'getTrashRootItem')) {
				$item = $backend->getTrashRootItem($user, $name);
				if ($item !== null) {
					return $item;
				}
			} else {
				$items = $backend->listTrashRoot($user);
				foreach ($items as $item) {
					if ($item->getName() === $name) {
						return $item;
					}
				}
			}
		}
		return null;
	}

	private function getBackendForItem(ITrashItem $item) {
		return $item->getTrashBackend();
	}

	#[\Override]
	public function listTrashFolder(ITrashItem $folder): array {
		return $this->getBackendForItem($folder)->listTrashFolder($folder);
	}

	#[\Override]
	public function restoreItem(ITrashItem $item) {
		return $this->withMutationLock(function () use ($item) {
			// A restore/redelete can preserve both cache ID and deletion second.
			// Change the revision before moving so old purge selections go stale.
			$item->getStorage()->getCache()->update($item->getId(), ['etag' => bin2hex(random_bytes(16))]);
			return $this->getBackendForItem($item)->restoreItem($item);
		});
	}

	#[\Override]
	public function removeItem(ITrashItem $item) {
		$this->withMutationLock(fn () => $this->getBackendForItem($item)->removeItem($item));
	}

	/**
	 * @param IStorage $storage
	 * @return ITrashBackend
	 * @throws BackendNotFoundException
	 */
	public function getBackendForStorage(IStorage $storage): ITrashBackend {
		$fullType = get_class($storage);
		$foundType = array_reduce(array_keys($this->backends), function ($type, $registeredType) use ($storage) {
			if (
				$storage->instanceOfStorage($registeredType)
				&& ($type === '' || is_subclass_of($registeredType, $type))
			) {
				return $registeredType;
			} else {
				return $type;
			}
		}, '');
		if ($foundType === '') {
			throw new BackendNotFoundException("Trash backend for $fullType not found");
		} else {
			return $this->backends[$foundType];
		}
	}

	#[\Override]
	public function moveToTrash(IStorage $storage, string $internalPath): bool {
		if ($this->trashPaused) {
			return false;
		}
		try {
			$backend = $this->getBackendForStorage($storage);
		} catch (BackendNotFoundException) {
			return false;
		}

		// pausing prevents the backend from recursing into the trash logic again,
		// it has to be released even when the move fails or the trash bin would
		// stay disabled for the rest of the request
		$this->trashPaused = true;
		try {
			return $backend->moveToTrash($storage, $internalPath);
		} finally {
			$this->trashPaused = false;
		}
	}

	#[\Override]
	public function getTrashNodeById(IUser $user, int $fileId) {
		foreach ($this->backends as $backend) {
			$item = $backend->getTrashNodeById($user, $fileId);
			if ($item !== null) {
				return $item;
			}
		}
		return null;
	}

	#[\Override]
	public function pauseTrash() {
		$this->trashPaused = true;
	}

	#[\Override]
	public function resumeTrash() {
		$this->trashPaused = false;
	}
}
