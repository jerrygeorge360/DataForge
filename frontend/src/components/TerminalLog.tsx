import { useEffect, useRef}from 'react'

export interface LogEntry {
    msg: string
    level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERR'
    time: string
}

interface TerminalLogProps {
    logs: LogEntry[]
}

function TerminalLog({ logs }: TerminalLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <div
            ref={scrollRef}
            className="card p-3 h-[200px] overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/40 border-accent/20 flex flex-col gap-1"
        >
            {logs.length === 0 ? (
                <div className="text-muted italic opacity-50">[System] Awaiting input signals...</div>
            ) : (
                logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="text-muted opacity-40 flex-shrink-0">[{log.time}]</span>
                        <span className={`flex-shrink-0 font-bold ${log.level === 'SUCCESS' ? 'text-success' :
                                log.level === 'ERR' ? 'text-error' :
                                    log.level === 'WARN' ? 'text-warning' :
                                        'text-accent'
                            }`}>
                            [{log.level}]
                        </span>
                        <span className="break-all opacity-90">{log.msg}</span>
                    </div>
                ))
            )}
        </div>
    )
}

export default TerminalLog
