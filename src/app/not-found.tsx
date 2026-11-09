const normalize = `(function(){var p=location.pathname;var t=p.replace(/^\\/artemis(?=\\/|$)/i,"").replace(/^\\/demo(?=\\/|$)/i,"/Demo").replace(/^\\/architecture(?=\\/|$)/i,"/Architecture");t="/"+t.replace(/^\\/+/,"");if(t!==p)location.replace(t+location.search+location.hash)})()`;
export default function NotFound() {
  return <main className="mx-auto max-w-3xl px-6 py-24"><script dangerouslySetInnerHTML={{ __html: normalize }} /><p className="ar-label">YovaSense</p><h1 className="ar-display mt-5 text-4xl">Page not found.</h1><p className="mt-6"><a href="/" className="underline">YovaSense home</a> · <a href="/Demo/" className="underline">Fleet demo</a></p></main>;
}
