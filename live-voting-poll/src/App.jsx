import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [options, setOptions] = useState([])

  useEffect(() => {
    // Fetch initial poll options
    const fetchOptions = async () => {
      const { data } = await supabase.from('options').select('*').order('id')
      if (data) setOptions(data)
    }
    fetchOptions()

    // Subscribe to real-time database changes
    const channel = supabase.channel('realtime-options')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, (payload) => {
        setOptions(currentOptions => 
          currentOptions.map(opt => opt.id === payload.new.id ? payload.new : opt)
        )
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Trigger the SQL function when someone clicks a button
  const handleVote = async (id) => {
    await supabase.rpc('increment_vote', { row_id: id })
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>Live Poll</h2>
      {options.map(option => (
        <div key={option.id} style={{ marginBottom: '1rem' }}>
          <button 
            onClick={() => handleVote(option.id)} 
            style={{ width: '100%', padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
          >
            <span>{option.text}</span>
            <strong>{option.votes} votes</strong>
          </button>
        </div>
      ))}
    </div>
  )
}

export default App