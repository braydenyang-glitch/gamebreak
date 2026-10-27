import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {handleApi} from '../../../server/api.mjs';
import {GUIDES} from '../../../public/data.js';
export const dynamic='force-dynamic';
async function handle(request:Request){return handleApi(request,{db:env.DB,user:await getChatGPTUser(),adminEmails:(env as any).GAMEBREAK_ADMIN_EMAILS||'',guides:GUIDES});}
export const GET=handle;
export const POST=handle;
export const PUT=handle;
export const PATCH=handle;
