// Polls Kie AI task status
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { taskId } = req.query
  const upstream = await fetch(
    `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`,
    { headers: { 'Authorization': `Bearer ${process.env.VITE_KIE_API_KEY}` } }
  )
  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
