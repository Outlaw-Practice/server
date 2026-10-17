# Upstream changes and patch ledger (N5-7, N5-12)

Deploy branch: `Outlaw-Practice/server`, `outlaw/stable35`. Build from the
signed upstream distribution and the exact base-to-tip diff, not a checkout's
generated web assets. The release's committed input manifest is authoritative.

For each patch, record upstream repository, base tag and full base commit,
local commit, affected behavior, regression test and upstream issue/PR URL
when submitted. Keep review-required branch protection. Do not force-push.
Reconcile all retained patches for every release candidate and final release:
compare upstream behavior and tests, drop a patch only once the selected
upstream release contains its behavior, and fail qualification when a patch
does not apply or an upstream change invalidates its assumptions.

Use an upstream-reference trailer in local patch commit messages:

```
N5-24: preserve retained history during account cleanup

Upstream-Base: nextcloud/server v35.0.2 ba900af933e61ffa005315b09d6454bfbbcbcc81
Upstream-Issue: pending submission
```

For an upstream backport use `git cherry-pick -x` so the source commit appears
in the message; resolve conflicts explicitly, preserve the upstream reference,
then run the relevant regression tests and independent review. Do not rewrite
already reviewed commit history merely to add these new message conventions.
Submit narrow fixes to the owning upstream repository, with a reachable bug
scenario, focused regression evidence and no private infrastructure details.
Upstream issue/PR creation is publication and needs its applicable authorization.

Current retained patch groups (submission pending):

| Repository/base | Local patch commit | Behavior and coverage |
| --- | --- | --- |
| nextcloud/server v35.0.2, `ba900af933e61ffa005315b09d6454bfbbcbcc81` | `9aeb9ea57fa9385671463f942b8783357a928340` | Version deletion flag; shared trash mutation lock; restore/expiry serialization; account deletion and provisioning rollback protections; history unlink failure handling. Retention-lock backend/HTTP/UI tests and installed scheduled-job qualification. |
| nextcloud/groupfolders 23.0.1, `7ac7bafbbed54a3b7e188668787c5394cb25d0be` | `51eba76d226ebc01399c901c0f8cf1d4a9185c51` | Shared expiry mutation lock, manual-cleanup and whole-folder removal protection, guarded commands/controllers. Personal/Teamfolders lifecycle, purge and installed-route tests. |

Deployment customizations (no upstream submission):

| Repository/base | Local patch commit | Behavior and coverage |
| --- | --- | --- |
| Outlaw-Practice/server, nextcloud/server v35.0.2 base `ba900af933e61ffa005315b09d6454bfbbcbcc81` | `37448ba0184eb0a7586cd25330f27e05b43a4209` | Version-specific matching-source links in the custom theme footer and About dialog. Two DOM lifecycle tests and installed login/About/mobile/public-share browser qualification. |

Local integration tips and per-build file inventories belong in each build's
source record. The ledger records patch purpose and origin, not a substitute
for verifying that a newer upstream release still needs the patch.
