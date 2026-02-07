const Editor = () => {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 min-h-[64px] bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold text-xl">ICHEN</span>
          <div className="w-px h-6 bg-border" />
          <span className="text-foreground text-sm">My First Novel</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
            Export
          </button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[250px] min-w-[250px] bg-sidebar border-r p-4 overflow-y-auto">
          <h2 className="font-semibold text-sm text-sidebar-foreground">Chapters</h2>
        </aside>

        {/* Center Editor */}
        <main className="flex-1 bg-background p-8 overflow-y-auto">
          <p className="text-muted-foreground">Start writing...</p>
        </main>

        {/* Right Sidebar */}
        <aside className="w-[300px] min-w-[300px] bg-muted border-l p-4 overflow-y-auto">
          <h2 className="font-semibold text-sm text-foreground">✨ Craft Coach</h2>
        </aside>
      </div>
    </div>
  );
};

export default Editor;
