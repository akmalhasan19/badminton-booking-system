"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Search, MoreVertical, Shield, User, UserMinus, ShieldAlert, ShieldCheck, Clock, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { Community } from "@/app/communities/actions"
import { updateCommunityDetails, getCommunityMembers, updateMemberRole, removeMember, CommunityMember } from "@/app/communities/actions"
import { useRouter } from "next/navigation"

const TIMEZONE_OPTIONS = [
    { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
    { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
    { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" }
] as const

interface CommunityEditModalProps {
    isOpen: boolean
    onClose: () => void
    community: Community
}

export function CommunityEditModal({ isOpen, onClose, community }: CommunityEditModalProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'details' | 'members'>('details')
    const [isLoading, setIsLoading] = useState(false)

    // Details Form State
    const [formData, setFormData] = useState({
        name: community.name,
        description: community.description || "",
        city: community.city || "",
        timezone: community.timezone || "Asia/Jakarta"
    })

    // Members State
    const [members, setMembers] = useState<CommunityMember[]>([])
    const [isLoadingMembers, setIsLoadingMembers] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeMemberMenu, setActiveMemberMenu] = useState<string | null>(null)
    const [showTimezoneOptions, setShowTimezoneOptions] = useState(false)
    const timezoneWrapperRef = useRef<HTMLDivElement>(null)

    // Reset form when community changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: community.name,
                description: community.description || "",
                city: community.city || "",
                timezone: community.timezone || "Asia/Jakarta"
            })
            fetchMembers()
        }
    }, [isOpen, community])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (timezoneWrapperRef.current && !timezoneWrapperRef.current.contains(event.target as Node)) {
                setShowTimezoneOptions(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const fetchMembers = async () => {
        setIsLoadingMembers(true)
        const result = await getCommunityMembers(community.id)
        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {
            setMembers(result.data)
        }
        setIsLoadingMembers(false)
    }

    const handleSaveDetails = async () => {
        setIsLoading(true)
        const data = new FormData()
        data.append('name', formData.name)
        data.append('description', formData.description)
        data.append('city', formData.city)
        data.append('timezone', formData.timezone)

        const result = await updateCommunityDetails(community.id, data)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Community details updated successfully")
            onClose()
            router.refresh()
        }
    }

    const handleRoleUpdate = async (memberId: string, newRole: 'admin' | 'member') => {
        const result = await updateMemberRole(community.id, memberId, newRole)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Member role updated to ${newRole}`)
            fetchMembers() // refresh list
            setActiveMemberMenu(null)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return

        const result = await removeMember(community.id, memberId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Member removed from community")
            fetchMembers() // refresh list
            setActiveMemberMenu(null)
        }
    }

    const filteredMembers = members.filter(member =>
        member.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const selectedTimezoneLabel = TIMEZONE_OPTIONS.find(option => option.value === formData.timezone)?.label ?? "Select timezone"

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4"
                    >
                        <div className="bg-white dark:bg-background-dark w-full max-w-2xl max-h-[80vh] rounded-3xl border-3 border-black shadow-hard overflow-hidden pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b-3 border-black flex justify-between items-center bg-neo-yellow">
                                <h2 className="text-xl font-black uppercase tracking-wider">Edit Community</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center bg-white border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5 stroke-[3px]" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b-3 border-black">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 py-4 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'details'
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`flex-1 py-4 font-bold uppercase tracking-wider text-sm transition-colors ${activeTab === 'members'
                                            ? 'bg-black text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }`}
                                >
                                    Members
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {activeTab === 'details' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold uppercase tracking-wide mb-2">Community Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-neo-yellow/50 transition-all"
                                                placeholder="e.g. Badminton Lovers"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold uppercase tracking-wide mb-2">City</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-neo-yellow/50 transition-all"
                                                placeholder="e.g. Jakarta"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold uppercase tracking-wide mb-2">Timezone</label>
                                            <div className="relative group" ref={timezoneWrapperRef}>
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Clock className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowTimezoneOptions((prev) => !prev)}
                                                    className="block w-full pl-12 pr-10 py-4 bg-white border-2 border-gray-200 rounded-xl text-black font-bold focus:outline-none focus:border-black focus:shadow-hard-sm transition-all text-left"
                                                    aria-haspopup="listbox"
                                                    aria-expanded={showTimezoneOptions}
                                                >
                                                    {selectedTimezoneLabel}
                                                </button>
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showTimezoneOptions ? "rotate-180" : ""}`} />
                                                </div>

                                                {showTimezoneOptions && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-xl shadow-hard z-50 overflow-hidden">
                                                        <ul role="listbox" aria-label="Timezone options">
                                                            {TIMEZONE_OPTIONS.map(option => {
                                                                const isSelected = option.value === formData.timezone
                                                                return (
                                                                    <li key={option.value}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, timezone: option.value })
                                                                                setShowTimezoneOptions(false)
                                                                            }}
                                                                            className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-gray-100 font-bold transition-colors ${isSelected ? "bg-pastel-mint/30" : "hover:bg-pastel-mint/30"}`}
                                                                            role="option"
                                                                            aria-selected={isSelected}
                                                                        >
                                                                            {option.label}
                                                                        </button>
                                                                    </li>
                                                                )
                                                            })}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Zona waktu dipakai untuk menentukan "hari ini" saat menampilkan aktivitas aktif.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-4 py-3 border-3 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-neo-yellow/50 transition-all min-h-[120px]"
                                                placeholder="Tell us about your community..."
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            <button
                                                onClick={handleSaveDetails}
                                                disabled={isLoading}
                                                className="bg-neo-green px-8 py-3 rounded-xl border-3 border-black shadow-hard hover:shadow-hard-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase tracking-wider flex items-center gap-2"
                                            >
                                                {isLoading ? "Saving..." : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 h-full flex flex-col">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search members..."
                                                className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-4 focus:ring-neo-blue/30"
                                            />
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px]">
                                            {isLoadingMembers ? (
                                                <div className="text-center py-10 text-gray-500 font-medium">Loading members...</div>
                                            ) : filteredMembers.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500 font-medium">No members found.</div>
                                            ) : (
                                                filteredMembers.map(member => (
                                                    <div key={member.id} className="flex items-center justify-between p-3 border-2 border-gray-100 rounded-xl hover:border-black transition-colors bg-white">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-black">
                                                                {member.profile.avatar_url ? (
                                                                    <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-neo-blue text-white font-bold">
                                                                        {member.profile.full_name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm">{member.profile.full_name}</div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${member.role === 'admin'
                                                                            ? 'bg-neo-yellow text-black border border-black'
                                                                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                                                                        }`}>
                                                                        {member.role}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setActiveMemberMenu(activeMemberMenu === member.id ? null : member.id)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>

                                                            {activeMemberMenu === member.id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveMemberMenu(null)} />
                                                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border-2 border-black shadow-hard rounded-lg overflow-hidden z-20 py-1">
                                                                        {member.role === 'member' ? (
                                                                            <button
                                                                                onClick={() => handleRoleUpdate(member.user_id, 'admin')}
                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 font-medium"
                                                                            >
                                                                                <ShieldCheck className="w-4 h-4 text-green-600" />
                                                                                Promote to Admin
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleRoleUpdate(member.user_id, 'member')}
                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 font-medium"
                                                                            >
                                                                                <ShieldAlert className="w-4 h-4 text-orange-600" />
                                                                                Demote to Member
                                                                            </button>
                                                                        )}
                                                                        <div className="h-px bg-gray-100 my-1" />
                                                                        <button
                                                                            onClick={() => handleRemoveMember(member.user_id)}
                                                                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 font-bold"
                                                                        >
                                                                            <UserMinus className="w-4 h-4" />
                                                                            Remove Member
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
