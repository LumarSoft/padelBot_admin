/** The WhatsApp inbox's own loading shape: full-bleed, the two panes already in place. */
export default function WhatsAppLoading() {
  return (
    <div
      data-full-bleed
      role="status"
      aria-label="Cargando chats"
      className="bg-wa-panel flex min-h-0 flex-1 overflow-hidden"
    >
      <div className="border-wa-line flex w-full flex-col md:w-[22rem] md:border-r lg:w-[26rem]">
        <div className="flex h-16 items-center px-5">
          <span className="text-wa-text text-[22px] font-bold tracking-tight">WhatsApp</span>
        </div>
        <div className="px-3 pb-2">
          <div className="bg-wa-search h-9 rounded-full" />
        </div>
        <div className="flex animate-pulse flex-col">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 pl-3">
              <span className="bg-wa-chip size-[49px] shrink-0 rounded-full" />
              <span className="border-wa-line flex flex-1 flex-col gap-2 border-b py-4 pr-4">
                <span className="bg-wa-chip h-3.5 w-1/2 rounded" />
                <span className="bg-wa-chip h-3 w-3/4 rounded" />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-wa-bar hidden flex-1 md:block" />
    </div>
  );
}
