import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── Companies ──────────────────────────────────────────────
export async function createCompany({ name, slug, adminEmail, emailDomain }) {
  return supabase.from('companies').insert({
    name, slug, admin_email: adminEmail, email_domain: emailDomain
  }).select().single()
}

export async function getCompanyBySlug(slug) {
  return supabase.from('companies').select('*').eq('slug', slug).single()
}

// ── Users ──────────────────────────────────────────────────
export async function createUser({ companyId, email, phone, fullName, role }) {
  return supabase.from('users').insert({
    company_id: companyId, email, phone, full_name: fullName, role
  }).select().single()
}

export async function getUsersByCompany(companyId) {
  return supabase.from('users').select('*').eq('company_id', companyId).eq('is_active', true)
}

export async function getUserByEmail(email, companyId) {
  return supabase.from('users').select('*').eq('email', email).eq('company_id', companyId).single()
}

export async function updateUser(id, updates) {
  return supabase.from('users').update(updates).eq('id', id)
}

export async function deactivateUser(id) {
  return supabase.from('users').update({ is_active: false }).eq('id', id)
}

// ── Rater assignments ──────────────────────────────────────
export async function assignRater({ companyId, leaderId, raterId, raterRole }) {
  return supabase.from('rater_assignments').upsert({
    company_id: companyId, leader_id: leaderId, rater_id: raterId, rater_role: raterRole, is_active: true
  })
}

export async function getRatersByLeader(leaderId) {
  return supabase.from('rater_assignments')
    .select('*, rater:rater_id(id, full_name, email, role)')
    .eq('leader_id', leaderId).eq('is_active', true)
}

export async function removeRater(leaderId, raterId) {
  return supabase.from('rater_assignments')
    .update({ is_active: false }).eq('leader_id', leaderId).eq('rater_id', raterId)
}

// ── Campaigns ──────────────────────────────────────────────
export async function createCampaign({ companyId, name, month, year, opensAt, closesAt }) {
  return supabase.from('survey_campaigns').insert({
    company_id: companyId, name, month, year,
    opens_at: opensAt, closes_at: closesAt, status: 'active'
  }).select().single()
}

export async function getCampaigns(companyId) {
  return supabase.from('survey_campaigns').select('*')
    .eq('company_id', companyId).order('year', { ascending: false }).order('month', { ascending: false })
}

export async function updateCampaignStatus(id, status) {
  return supabase.from('survey_campaigns').update({ status }).eq('id', id)
}

// ── Survey responses ───────────────────────────────────────
export async function submitResponse({ campaignId, leaderId, raterId, raterRole, companyId, scores, nfrDeclared, comment }) {
  return supabase.from('survey_responses').upsert({
    campaign_id: campaignId, leader_id: leaderId, rater_id: raterId,
    rater_role: raterRole, company_id: companyId,
    q1_score: scores[0], q2_score: scores[1], q3_score: scores[2],
    q4_score: scores[3], q5_score: scores[4],
    nfr_declared: nfrDeclared, comment
  })
}

export async function getResponsesByCampaignLeader(campaignId, leaderId) {
  return supabase.from('survey_responses').select('*')
    .eq('campaign_id', campaignId).eq('leader_id', leaderId)
}

// ── Leader scores ──────────────────────────────────────────
export async function getLeaderScores(leaderId) {
  return supabase.from('leader_scores')
    .select('*, campaign:campaign_id(name, month, year)')
    .eq('leader_id', leaderId)
    .order('created_at', { ascending: false })
    .limit(12)
}

export async function getCompanyScores(companyId, campaignId) {
  return supabase.from('leader_scores')
    .select('*, leader:leader_id(full_name, email)')
    .eq('company_id', companyId)
    .eq('campaign_id', campaignId)
}

// ── Action plans ───────────────────────────────────────────
export async function getActionPlans(leaderId) {
  return supabase.from('action_plans').select('*').eq('leader_id', leaderId).order('created_at', { ascending: false })
}

export async function upsertActionPlan(plan) {
  return supabase.from('action_plans').upsert(plan)
}
