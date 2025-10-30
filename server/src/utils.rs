use rand::Rng;

/// Genera un friend code univoco nel formato "GC-XXXX-XXXX"
pub fn generate_friend_code() -> String {
    let mut rng = rand::thread_rng();
    
    // Caratteri disponibili: maiuscole e numeri (esclusi I, O, 0, 1 per evitare confusione)
    const CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    
    let part1: String = (0..4)
        .map(|_| {
            let idx = rng.gen_range(0..CHARS.len());
            CHARS[idx] as char
        })
        .collect();
    
    let part2: String = (0..4)
        .map(|_| {
            let idx = rng.gen_range(0..CHARS.len());
            CHARS[idx] as char
        })
        .collect();
    
    format!("GC-{}-{}", part1, part2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_friend_code() {
        let code = generate_friend_code();
        assert_eq!(code.len(), 11); // GC-XXXX-XXXX
        assert!(code.starts_with("GC-"));
        
        // Verifica formato
        let parts: Vec<&str> = code.split('-').collect();
        assert_eq!(parts.len(), 3);
        assert_eq!(parts[0], "GC");
        assert_eq!(parts[1].len(), 4);
        assert_eq!(parts[2].len(), 4);
    }

    #[test]
    fn test_uniqueness() {
        let mut codes = std::collections::HashSet::new();
        for _ in 0..1000 {
            let code = generate_friend_code();
            codes.insert(code);
        }
        // Dovrebbero essere tutti univoci
        assert_eq!(codes.len(), 1000);
    }
}
