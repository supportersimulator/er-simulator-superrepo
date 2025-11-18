

### 3.5 Proposed Command List (NOT YET EXECUTED)

If/when Aaron approves Group B archival, Hermes can run the following commands from the repo root:

```bash
mkdir -p legacy-apps-script/test-wrappers

# TEST_* from google-drive-code/apps-script/
mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #1 - Categories_Pathways_Feature_Phase2.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #1 - Multi_Step_Cache_Enrichment.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #2 - Batch_Processing_Sidebar_Feature.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #2 - Core_Processing_Engine.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #3 - Batch_Processing_Sidebar_Feature.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/apps-script/TEST_Feature_Based_Code #3 - Core_Processing_Engine.gs' \
   'legacy-apps-script/test-wrappers/'

# TEST_* from google-drive-code/atsr-tools/
mv 'google-drive-code/atsr-tools/TEST_Feature_Based_Code #2 - ATSR_Title_Generator_Feature.gs' \
   'legacy-apps-script/test-wrappers/'

mv 'google-drive-code/atsr-tools/TEST_Feature_Based_Code #3 - ATSR_Title_Generator_Feature.gs' \
   'legacy-apps-script/test-wrappers/'

# TEST_* from simulator-core/er-sim-monitor/backups/
mv 'simulator-core/er-sim-monitor/backups/emergency-2025-11-06T13-49-25/TEST_Code_just_deployed.gs' \
   'legacy-apps-script/test-wrappers/'
```

> These commands are **not** being run yet. They are provided for review and explicit approval before execution.
