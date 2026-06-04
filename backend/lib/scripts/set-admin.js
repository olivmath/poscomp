"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
// Prefer explicit service account (GOOGLE_APPLICATION_CREDENTIALS). Fall back to
// Application Default Credentials, but detect missing quota project and give a
// clear instruction instead of surfacing the raw FirebaseAuthError.
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
const adcPath = (0, path_1.join)((0, os_1.homedir)(), '.config', 'gcloud', 'application_default_credentials.json');
let credential;
let usingADCCredentials = false;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = (0, app_1.cert)(process.env.GOOGLE_APPLICATION_CREDENTIALS);
}
else {
    if ((0, fs_1.existsSync)(adcPath))
        usingADCCredentials = true;
    credential = (0, app_1.applicationDefault)();
    if (usingADCCredentials) {
        try {
            const adcJson = JSON.parse((0, fs_1.readFileSync)(adcPath, 'utf8'));
            if (!adcJson.quota_project_id) {
                console.error('Application Default Credentials are in use but no quota project is set.');
                console.error('Set it with:');
                console.error(`  gcloud auth application-default set-quota-project ${projectId ?? '<PROJECT_ID>'}`);
                console.error('Or provide a service account key and set GOOGLE_APPLICATION_CREDENTIALS to its path.');
                process.exit(1);
            }
        }
        catch (e) {
            console.error('Failed to read Application Default Credentials file:', e);
            process.exit(1);
        }
    }
}
(0, app_1.initializeApp)({ credential, projectId });
async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Usage: npx tsx backend/src/scripts/set-admin.ts <email>');
        process.exit(1);
    }
    try {
        const auth = (0, auth_1.getAuth)();
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log(`✓ Admin claim set for ${email} (${user.uid})`);
        process.exit(0);
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=set-admin.js.map