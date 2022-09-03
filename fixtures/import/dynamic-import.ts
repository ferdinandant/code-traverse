import dynamic from 'next/dynamic';

const MyPage = dynamic(() => import('./myPage'));
const [a, b] = dynamic(() => import('./myPage2'));
import('./myOtherPage');

function getNewPage() {
  return import('./myNewPage');
}

const module = await Promise.all([import('xxx'), import('yyy')]);
const [c, d] = await Promise.all([import('c'), import('d')]);
