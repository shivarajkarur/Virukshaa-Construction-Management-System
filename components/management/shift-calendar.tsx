"use client"
import React, { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

type ShiftDoc = {
  _id?: string
  employeeId: string
  projectId: string
  date: string | Date
  shifts: number
  perShiftSalary: number
  totalPay: number
}

export interface ShiftCalendarProps {
  employeeId: string
  projectId?: string | null
  perShiftSalary?: number
  initialMonth?: string // YYYY-MM
}

function formatYMD(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function startOfMonth(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  return x
}

function endOfMonth(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
  return x
}

function addMonths(d: Date, delta: number): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1))
  return x
}

const monthNames = [
  "January","February","March","April","May","June","July","August","September","October","November","December"
]
const weekdayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

function colorForShifts(n: number): string {
  // Tailwind utility classes for background; stronger for more shifts
  const map: Record<string, string> = {
    "0": "bg-muted",
    "0.5": "bg-sky-100 text-sky-800",
    "1": "bg-emerald-100 text-emerald-800",
    "1.5": "bg-teal-100 text-teal-800",
    "2": "bg-amber-100 text-amber-900",
    "2.5": "bg-orange-100 text-orange-900",
    "3": "bg-red-100 text-red-900",
  }
  return map[String(n)] || "bg-muted"
}

function clampHalf(n: number): number {
  const rounded = Math.round((n ?? 0) * 2) / 2
  return Math.max(0, Math.min(3, rounded))
}

export default function ShiftCalendar({ employeeId, projectId = null, perShiftSalary, initialMonth }: ShiftCalendarProps) {
  const initial = useMemo(() => {
    if (initialMonth && /\d{4}-\d{2}/.test(initialMonth)) {
      const [y, m] = initialMonth.split("-").map(Number)
      return new Date(Date.UTC(y, m - 1, 1))
    }
    return startOfMonth(new Date())
  }, [initialMonth])

  const [month, setMonth] = useState<Date>(initial)
  const [shiftsByDate, setShiftsByDate] = useState<Record<string, ShiftDoc>>({})
  const [loading, setLoading] = useState(false)
  const [savingDates, setSavingDates] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<{ dateStr: string, doc?: ShiftDoc, shifts: number, perShiftSalary: number } | null>(null)

  const effectivePerShift = editTarget?.perShiftSalary
    ?? perShiftSalary
    ?? 0

  const monthStart = useMemo(() => startOfMonth(month), [month])
  const monthEnd = useMemo(() => endOfMonth(month), [month])

  // Build calendar cells with leading/trailing days to fill weeks (start Sunday)
  const cells = useMemo(() => {
    const startDow = monthStart.getUTCDay() // 0=Sun
    const daysInMonth = monthEnd.getUTCDate()

    const leading: Date[] = []
    for (let i = 0; i < startDow; i++) {
      const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1 - (startDow - i)))
      leading.push(d)
    }
    const current: Date[] = []
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), i))
      d.setUTCHours(0,0,0,0)
      current.push(d)
    }
    const totalCells = Math.ceil((leading.length + current.length) / 7) * 7
    const trailingCount = totalCells - (leading.length + current.length)
    const trailing: Date[] = []
    for (let i = 1; i <= trailingCount; i++) {
      const d = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, i))
      trailing.push(d)
    }
    return [...leading, ...current, ...trailing]
  }, [monthStart, monthEnd])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        const qs = new URLSearchParams()
        qs.set("start", formatYMD(monthStart))
        qs.set("end", formatYMD(monthEnd))
        if (employeeId) qs.set("employeeId", employeeId)
        if (projectId) qs.set("projectId", String(projectId))
        const res = await fetch(`/api/employee-shifts?${qs.toString()}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Failed to load shifts: ${res.status}`)
        const docs: any[] = await res.json()
        const map: Record<string, ShiftDoc> = {}
        for (const doc of docs) {
          const d = new Date(doc.date)
          d.setUTCHours(0,0,0,0)
          map[formatYMD(d)] = {
            _id: doc._id,
            employeeId: String(doc.employeeId),
            projectId: String(doc.projectId),
            date: d.toISOString(),
            shifts: Number(doc.shifts ?? 0),
            perShiftSalary: Number(doc.perShiftSalary ?? perShiftSalary ?? 0),
            totalPay: Number(doc.totalPay ?? 0),
          }
        }
        setShiftsByDate(map)
      } catch (e: any) {
        console.error(e)
        toast.error(e?.message || "Unable to load shifts")
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [monthStart, monthEnd, employeeId, projectId, perShiftSalary])

  const onOpenEdit = (date: Date) => {
    const dateStr = formatYMD(date)
    const existing = shiftsByDate[dateStr]
    setEditTarget({
      dateStr,
      doc: existing,
      shifts: clampHalf(existing?.shifts ?? 0),
      perShiftSalary: existing?.perShiftSalary ?? perShiftSalary ?? 0,
    })
  }

  const onSave = async () => {
    if (!editTarget) return
    const { dateStr, shifts, perShiftSalary: pss } = editTarget
    if (!employeeId) {
      toast.error("Missing employeeId")
      return
    }
    const body = {
      employeeId,
      projectId: projectId ?? undefined,
      date: dateStr,
      shifts: clampHalf(shifts),
      perShiftSalary: Number(pss ?? perShiftSalary ?? 0),
    }
    try {
      const pending = new Set(savingDates)
      pending.add(dateStr)
      setSavingDates(pending)

      // Prefer POST for upsert to avoid unauthorized errors locally
      const res = await fetch("/api/employee-shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Failed to save shift: ${res.status}`)
      const doc: any = await res.json()
      const d = new Date(doc.date)
      d.setUTCHours(0,0,0,0)
      const updated: ShiftDoc = {
        _id: doc._id,
        employeeId: String(doc.employeeId),
        projectId: String(doc.projectId),
        date: d.toISOString(),
        shifts: Number(doc.shifts ?? body.shifts),
        perShiftSalary: Number(doc.perShiftSalary ?? body.perShiftSalary),
        totalPay: Number(doc.totalPay ?? (body.shifts * Number(body.perShiftSalary))),
      }
      setShiftsByDate(prev => ({ ...prev, [dateStr]: updated }))
      toast.success("Shift saved")
      setEditTarget(null)
    } catch (e: any) {
      console.error(e)
      toast.error(e?.message || "Unable to save shift")
    } finally {
      setSavingDates(prev => {
        const next = new Set(prev)
        next.delete(dateStr)
        return next
      })
    }
  }

  const isCurrentMonth = (d: Date) => d.getUTCMonth() === month.getUTCMonth() && d.getUTCFullYear() === month.getUTCFullYear()

  const MonthSelector = () => {
    const year = month.getUTCFullYear()
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setMonth(m => addMonths(m, -1))}>{"<"}</Button>
        <Select value={String(month.getUTCMonth())} onValueChange={(v) => {
          const m = Number(v)
          setMonth(new Date(Date.UTC(year, m, 1)))
        }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthNames.map((nm, idx) => (
              <SelectItem key={nm} value={String(idx)}>{nm}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={year}
          onChange={(e) => {
            const y = Number(e.target.value)
            if (!Number.isNaN(y)) setMonth(new Date(Date.UTC(y, month.getUTCMonth(), 1)))
          }}
          className="w-[100px]"
        />
        <Button variant="outline" size="sm" onClick={() => setMonth(m => addMonths(m, 1))}>{">"}</Button>
        <Button variant="ghost" size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Shift Calendar</div>
          <div className="text-sm text-muted-foreground">{monthNames[month.getUTCMonth()]} {month.getUTCFullYear()}</div>
        </div>
        <MonthSelector />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground">
        {weekdayNames.map(w => (
          <div key={w} className="text-center">{w}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {cells.map((d, idx) => {
          const dateStr = formatYMD(d)
          const doc = shiftsByDate[dateStr]
          const inMonth = isCurrentMonth(d)
          const pending = savingDates.has(dateStr)
          const bgClass = doc ? colorForShifts(Number(doc.shifts)) : "bg-muted"
          return (
            <TooltipProvider key={dateStr + idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => inMonth && onOpenEdit(d)}
                    className={`relative rounded-md border p-2 text-left transition ${inMonth ? "hover:ring-2 hover:ring-primary" : "opacity-50"}`}
                    disabled={!inMonth || pending}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-medium ${inMonth ? "" : "text-muted-foreground"}`}>{d.getUTCDate()}</div>
                      {pending && <div className="text-xs text-muted-foreground">Saving…</div>}
                    </div>
                    {doc ? (
                      <div className={`mt-2 ${bgClass} rounded px-2 py-1 text-xs`}>Shifts: {doc.shifts}</div>
                    ) : (
                      <div className="mt-2 text-xs text-muted-foreground">No shifts</div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {doc ? (
                    <div className="space-y-1">
                      <div className="font-medium">{dateStr}</div>
                      <div>Shifts: {doc.shifts}</div>
                      <div>Rate: {doc.perShiftSalary}</div>
                      <div>Total: {doc.totalPay}</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="font-medium">{dateStr}</div>
                      <div>No shifts assigned</div>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Shifts</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Date: {editTarget.dateStr}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Shifts</label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    max={3}
                    value={editTarget.shifts}
                    onChange={(e) => setEditTarget(v => v ? { ...v, shifts: clampHalf(Number(e.target.value)) } : v)}
                  />
                </div>
                <div>
                  <label className="text-sm">Rate per shift</label>
                  <Input
                    type="number"
                    min={0}
                    value={editTarget.perShiftSalary}
                    onChange={(e) => setEditTarget(v => v ? { ...v, perShiftSalary: Math.max(0, Number(e.target.value)) } : v)}
                  />
                </div>
              </div>
              <div className="text-sm">Total Pay: {(clampHalf(editTarget.shifts) * (editTarget.perShiftSalary ?? 0)).toFixed(2)}</div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={onSave} disabled={savingDates.has(editTarget.dateStr)}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}