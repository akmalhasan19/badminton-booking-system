export type Language = 'en' | 'id' | 'jv';

export type Dictionary = {
    // Navbar
    home: string;
    book: string;
    match: string;
    shop: string;
    join_us: string;
    login: string;
    logout: string;
    my_bookings: string;
    edit_profile: string;
    payment_methods: string;
    notifications: string;
    settings: string;
    help_center: string;
    smash_member: string;
    communities: string;
    // Partner Register Page
    become_partners: string;
    grow_business: string;
    join_network: string;
    owner_details: string;
    owner_name: string;
    owner_name_placeholder: string;
    company_email: string;
    whatsapp_number: string;
    venue_info: string;
    venue_name: string;
    venue_name_placeholder: string;
    venue_location: string;
    venue_location_placeholder: string;
    use_current_location: string;
    detecting: string;
    coords_detected: string;
    social_media: string;
    website: string;
    flooring_material: string;
    flooring_placeholder: string;
    club_details: string;
    routine_clubs: string;
    routine_clubs_placeholder: string;
    submit_application: string;
    submitting: string;
    registration_success: string;
    registration_success_msg: string;
    back_to_home: string;

    // Hero Section
    hero_badge: string;
    hero_line1_word1: string;
    hero_line1_word2: string;
    hero_line2_word1: string;
    hero_line2_word2: string;
    hero_description: string;
    book_now: string;
    shop_gear: string;
    new_season: string;

    // Partner Onboarding
    welcome_partner: string;
    revolutionize_your: string;
    sports_venue: string;
    onboarding_desc: string;
    your_goals: string;
    goals_title: string;
    goals_desc: string;
    choose_plan: string;
    select_subscription: string;
    pick_your_plan: string;
    see_options_right: string;
    select_your_power: string;
    subscription_word: string;
    all_set: string;
    ready_to: string;
    level_up: string;
    boost_msg: string;
    next_step: string;
    next_step_desc: string;
    back_btn: string;
    skip_btn: string;
    continue_btn: string;
    get_started: string;
    verified_partner: string;
    ready_to_launch: string;
    goal_bookings: string;
    goal_management: string;
    goal_payments: string;
    goal_members: string;
    goal_tournaments: string;

    // Footer
    footer_tagline: string;
    footer_tagline_line2: string;
    footer_platform: string;
    footer_find_court: string;
    footer_tournaments: string;
    footer_coaching: string;
    footer_pro_shop: string;
    footer_legal: string;
    footer_privacy: string;
    footer_terms: string;
    footer_cookies: string;
    footer_copyright: string;
    footer_designed_in: string;

    // Booking Section
    lock_it_in: string;
    details_header: string;
    back_to_halls: string;
    select_date: string;
    available_slots: string;
    court_fee: string;
    service_fee: string;
    total: string;
    confirm_booking: string;
    booked: string;
    no_slots: string;
    select_court_location: string;
    location_label: string;
    facilities_label: string;
    courts: string;
    floor: string;
    venue_label: string;
    court_label: string;
    address_label: string;
    court_type_standard: string;
    court_type_vinyl: string;
    court_type_wood: string;
    court_type_cement: string;
}

export const dictionaries: Record<Language, Dictionary> = {
    en: {
        home: "HOME",
        book: "BOOK",
        match: "MATCH",
        shop: "SHOP",
        join_us: "Join Us",
        login: "Login",
        logout: "Logout",
        my_bookings: "My Bookings",
        edit_profile: "Edit Profile",
        payment_methods: "Payment Methods",
        notifications: "Notifications",
        settings: "Settings",
        help_center: "Help Center",
        smash_member: "Smash Member",
        communities: "Communities",
        become_partners: "BECOME A PARTNER",
        grow_business: "Grow Your Sports Venue\nBusiness with Smash.",
        join_network: "Join our network of premium badminton courts. Manage bookings efficiently and reach more players.",
        owner_details: "Owner Details",
        owner_name: "Badminton Hall Owner Name",
        owner_name_placeholder: "Full Owner Name",
        company_email: "Company/Owner Email",
        whatsapp_number: "Management/Owner WhatsApp",
        venue_info: "Venue Information",
        venue_name: "Venue Name",
        venue_name_placeholder: "e.g. GOR Sinar Badminton",
        venue_location: "Venue Location",
        venue_location_placeholder: "Complete Venue Address",
        use_current_location: "Use My Current Location",
        detecting: "Detecting...",
        coords_detected: "Coordinates detected",
        social_media: "Social Media Page",
        website: "Official Website (Optional)",
        flooring_material: "Flooring Material",
        flooring_placeholder: "e.g. Vinyl Carpet, Wood, Cement",
        club_details: "Club & Routine Details",
        routine_clubs: "List of Routine Clubs",
        routine_clubs_placeholder: "List badminton clubs that play routinely at your venue...",
        submit_application: "Submit Application",
        submitting: "Submitting...",
        registration_success: "Registration Successful!",
        registration_success_msg: "Thank you for joining. Please wait up to 1x24 hours for verification process. Our team will contact you via email for the next steps.",
        back_to_home: "Back to Home",

        // Hero Section
        hero_badge: "The Future of Badminton",
        hero_line1_word1: "SERVE",
        hero_line1_word2: "LOOKS.",
        hero_line2_word1: "SMASH",
        hero_line2_word2: "HARD.",
        hero_description: "A next-gen court booking experience. Curated for the modern player who cares about aesthetics as much as athletics.",
        book_now: "Book Now",
        shop_gear: "Shop Gear",
        new_season: "New Season",

        // Partner Onboarding
        welcome_partner: "Welcome Partner",
        revolutionize_your: "Revolutionize Your",
        sports_venue: "Sports Venue.",
        onboarding_desc: "Join the future of court booking. We help you manage, grow, and automate your sports facility business effortlessly.",
        your_goals: "Your Goals",
        goals_title: "What matters most to you right now?",
        goals_desc: "Select the key areas where you want to see improvement. We'll tailor the experience for you.",
        choose_plan: "Choose Plan",
        select_subscription: "Select Subscription",
        pick_your_plan: "Pick Your Plan",
        see_options_right: "See options on the right",
        select_your_power: "Select Your Power",
        subscription_word: "Subscription.",
        all_set: "All Set",
        ready_to: "You're ready to",
        level_up: "Level Up!",
        boost_msg: "Based on your choices, we're confident Smash can boost your revenue by up to 40% in the first 3 months.",
        next_step: "Next Step:",
        next_step_desc: "Complete your venue profile registration to get access to your dashboard.",
        back_btn: "Back",
        skip_btn: "Skip",
        continue_btn: "Continue",
        get_started: "Get Started",
        verified_partner: "Verified Partner",
        ready_to_launch: "Ready to Launch!",
        goal_bookings: "Increase Bookings",
        goal_management: "Easy Management",
        goal_payments: "Online Payments",
        goal_members: "Member System",
        goal_tournaments: "Tournaments",

        // Footer
        footer_tagline: "Badminton for the internet generation.",
        footer_tagline_line2: "Less hassle. More hustle.",
        footer_platform: "Platform",
        footer_find_court: "Find a Court",
        footer_tournaments: "Tournaments",
        footer_coaching: "Coaching",
        footer_pro_shop: "Pro Shop",
        footer_legal: "Legal",
        footer_privacy: "Privacy",
        footer_terms: "Terms",
        footer_cookies: "Cookies",
        footer_copyright: "© 2024 Smash & Serve.",
        footer_designed_in: "Designed in the Metaverse",

        // Booking Section
        lock_it_in: "Lock It In",
        details_header: "Details",
        back_to_halls: "Back to Halls",
        select_date: "Select Date",
        available_slots: "Available Slots",
        court_fee: "Court Fee",
        service_fee: "Service Fee",
        total: "TOTAL",
        confirm_booking: "CONFIRM BOOKING",
        booked: "Booked",
        no_slots: "No slots available",
        select_court_location: "Select Court Location",
        location_label: "Location",
        facilities_label: "Facilities",
        courts: "Courts",
        floor: "Floor",
        venue_label: "Venue",
        court_label: "Court",
        address_label: "Address",
        court_type_standard: "Standard Court",
        court_type_vinyl: "Vinyl Court",
        court_type_wood: "Wood Court",
        court_type_cement: "Cement Court"
    },
    id: {
        home: "BERANDA",
        book: "PESAN",
        match: "TANDING",
        shop: "BELANJA",
        join_us: "Gabung Mitra",
        login: "Masuk",
        communities: "Komunitas",
        logout: "Keluar",
        my_bookings: "Booking Saya",
        edit_profile: "Ubah Profil",
        payment_methods: "Metode Pembayaran",
        notifications: "Notifikasi",
        settings: "Pengaturan",
        help_center: "Pusat Bantuan",
        smash_member: "Member Smash",

        become_partners: "JADI MITRA KAMI",
        grow_business: "Kembangkan Bisnis Lapangan\nOlahraga Anda dengan Smash.",
        join_network: "Bergabunglah dengan jaringan lapangan badminton premium kami. Kelola pesanan dengan efisien dan jangkau lebih banyak pemain.",
        owner_details: "Detail Pemilik",
        owner_name: "Nama Pemilik GOR",
        owner_name_placeholder: "Nama Lengkap Pemilik",
        company_email: "Email Perusahaan/Pemilik",
        whatsapp_number: "No WhatsApp Manajemen/Pemilik",
        venue_info: "Informasi Venue",
        venue_name: "Nama GOR",
        venue_name_placeholder: "contoh: GOR Sinar Badminton",
        venue_location: "Lokasi GOR",
        venue_location_placeholder: "Alamat Lengkap GOR",
        use_current_location: "Gunakan Lokasi Saya Saat Ini",
        detecting: "Mendeteksi...",
        coords_detected: "Koordinat terdeteksi",
        social_media: "Halaman Media Sosial",
        website: "Website Resmi (Opsional)",
        flooring_material: "Material Lantai",
        flooring_placeholder: "contoh: Karpet Vinyl, Kayu, Semen",
        club_details: "Detail Klub & Rutinitas",
        routine_clubs: "Daftar PB Rutin",
        routine_clubs_placeholder: "Daftar klub badminton yang bermain rutin di venue Anda...",
        submit_application: "Kirim Aplikasi",
        submitting: "Mengirim...",
        registration_success: "Registrasi Berhasil!",
        registration_success_msg: "Terima kasih telah bergabung. Mohon tunggu maksimal 1x24 jam untuk proses verifikasi. Tim kami akan segera menghubungi Anda melalui email untuk langkah selanjutnya.",
        back_to_home: "Kembali ke Beranda",

        // Hero Section
        hero_badge: "Masa Depan Badminton",
        hero_line1_word1: "TAMPIL",
        hero_line1_word2: "KEREN.",
        hero_line2_word1: "SMASH",
        hero_line2_word2: "KERAS.",
        hero_description: "Pengalaman booking lapangan generasi baru. Dirancang untuk pemain modern yang peduli estetika sebesar atletis.",
        book_now: "Pesan Sekarang",
        shop_gear: "Belanja Perlengkapan",
        new_season: "Musim Baru",

        // Partner Onboarding
        welcome_partner: "Selamat Datang Mitra",
        revolutionize_your: "Revolusi Bisnis",
        sports_venue: "Venue Olahraga.",
        onboarding_desc: "Bergabunglah dengan masa depan booking lapangan. Kami bantu Anda mengelola, mengembangkan, dan mengotomatiskan bisnis fasilitas olahraga dengan mudah.",
        your_goals: "Tujuan Anda",
        goals_title: "Apa yang paling penting bagi Anda saat ini?",
        goals_desc: "Pilih area utama yang ingin Anda tingkatkan. Kami akan menyesuaikan pengalaman untuk Anda.",
        choose_plan: "Pilih Paket",
        select_subscription: "Pilih Langganan",
        pick_your_plan: "Pilih Paket Anda",
        see_options_right: "Lihat pilihan di sebelah kanan",
        select_your_power: "Pilih Kekuatan Anda",
        subscription_word: "Langganan.",
        all_set: "Siap!",
        ready_to: "Anda siap untuk",
        level_up: "Naik Level!",
        boost_msg: "Berdasarkan pilihan Anda, kami yakin Smash dapat meningkatkan pendapatan Anda hingga 40% dalam 3 bulan pertama.",
        next_step: "Langkah Selanjutnya:",
        next_step_desc: "Lengkapi registrasi profil venue untuk akses dashboard Anda.",
        back_btn: "Kembali",
        skip_btn: "Lewati",
        continue_btn: "Lanjutkan",
        get_started: "Mulai Sekarang",
        verified_partner: "Mitra Terverifikasi",
        ready_to_launch: "Siap Diluncurkan!",
        goal_bookings: "Tingkatkan Booking",
        goal_management: "Manajemen Mudah",
        goal_payments: "Pembayaran Online",
        goal_members: "Sistem Member",
        goal_tournaments: "Turnamen",

        // Footer
        footer_tagline: "Badminton untuk generasi internet.",
        footer_tagline_line2: "Lebih mudah. Lebih semangat.",
        footer_platform: "Platform",
        footer_find_court: "Cari Lapangan",
        footer_tournaments: "Turnamen",
        footer_coaching: "Pelatihan",
        footer_pro_shop: "Toko Pro",
        footer_legal: "Legal",
        footer_privacy: "Privasi",
        footer_terms: "Ketentuan",
        footer_cookies: "Cookies",
        footer_copyright: "© 2024 Smash & Serve.",
        footer_designed_in: "Didesain di Metaverse",

        // Booking Section
        lock_it_in: "Amankan Slot",
        details_header: "Detail",
        back_to_halls: "Kembali ke Daftar",
        select_date: "Pilih Tanggal",
        available_slots: "Slot Tersedia",
        court_fee: "Biaya Sewa",
        service_fee: "Biaya Layanan",
        total: "TOTAL",
        confirm_booking: "KONFIRMASI BOOKING",
        booked: "Dipesan",
        no_slots: "Tidak ada slot tersedia",
        select_court_location: "Pilih Posisi Lapangan",
        location_label: "Lokasi",
        facilities_label: "Fasilitas",
        courts: "Lapangan",
        floor: "Lantai",
        venue_label: "Venue",
        court_label: "Lapangan",
        address_label: "Alamat",
        court_type_standard: "Lapangan Standar",
        court_type_vinyl: "Lapangan Karpet",
        court_type_wood: "Lapangan Kayu",
        court_type_cement: "Lapangan Semen"
    },
    jv: {
        home: "GRIYA",
        book: "PESEN",
        match: "TANDING",
        shop: "WANDÉ",
        join_us: "Ndherek Gabung",
        login: "Mlebet",
        logout: "Medal",
        communities: "Kelompok",
        my_bookings: "Pesesan Kulo",
        edit_profile: "Gantos Profil",
        payment_methods: "Metode Pembayaran",
        notifications: "Paring Ngertos",
        settings: "Pengaturan",
        help_center: "Pusat Bantuan",
        smash_member: "Warga Smash",
        become_partners: "DADOS MITRA KAMI",
        grow_business: "Ngembangaken Usaha Lapangan\nOlahraga Panjenengan kaliyan Smash.",
        join_network: "Ndherek gabung kaliyan jaringan lapangan badminton premium kami. Atur pesenan kanthi gampil lan nggayuh langkung kathah pemain.",
        owner_details: "Data Pemilik",
        owner_name: "Asma Pemilik GOR",
        owner_name_placeholder: "Asma Jangkep Pemilik",
        company_email: "Email Perusahaan/Pemilik",
        whatsapp_number: "Nomor WhatsApp Manajemen/Pemilik",
        venue_info: "Katerangan Panggenan",
        venue_name: "Asma GOR",
        venue_name_placeholder: "tuladha: GOR Sinar Badminton",
        venue_location: "Panggenan GOR",
        venue_location_placeholder: "Alamat Jangkep GOR",
        use_current_location: "Agem Lokasi Kulo Sakmenika",
        detecting: "Madosi...",
        coords_detected: "Koordinat kapanggih",
        social_media: "Kaca Media Sosial",
        website: "Website Resmi (Mboten Wajib)",
        flooring_material: "Bahan Lantai",
        flooring_placeholder: "tuladha: Karpet Vinyl, Kajeng, Semen",
        club_details: "Katerangan Klub & Rutinitas",
        routine_clubs: "Daftar PB Rutin",
        routine_clubs_placeholder: "Daftar klub badminton ingkang main rutin wonten panggenan Panjenengan...",
        submit_application: "Kirim Lamaran",
        submitting: "Ngirim...",
        registration_success: "Registrasi Berhasil!",
        registration_success_msg: "Matur nuwun sampun gabung. Ngentosi maksimal 1x24 jam kangge proses verifikasi. Tim kami badhe ngubungi Panjenengan liwat email kangge langkah selajengipun.",
        back_to_home: "Wangsul dateng Griya",

        // Hero Section
        hero_badge: "Masa Depan Badminton",
        hero_line1_word1: "TAMPIL",
        hero_line1_word2: "GAGAH.",
        hero_line2_word1: "SMASH",
        hero_line2_word2: "SERU.",
        hero_description: "Pengalaman pesen lapangan generasi anyar. Dirancang kangge pemain modern ingkang peduli estetika kados atletis.",
        book_now: "Pesen Sakniki",
        shop_gear: "Tumbas Perlengkapan",
        new_season: "Musim Anyar",

        // Partner Onboarding
        welcome_partner: "Sugeng Rawuh Mitra",
        revolutionize_your: "Revolusi Bisnis",
        sports_venue: "Panggenan Olahraga.",
        onboarding_desc: "Ndherek kaliyan masa depan pesen lapangan. Kami bantu Panjenengan ngatur, ngembangaken, lan ngotomatisaken bisnis fasilitas olahraga kanthi gampil.",
        your_goals: "Tujuan Panjenengan",
        goals_title: "Punapa ingkang paling wigatos kangge Panjenengan sakniki?",
        goals_desc: "Pilih wilayah utami ingkang Panjenengan kepengin tingkataken. Kami badhe nyesuaiaken pengalaman kangge Panjenengan.",
        choose_plan: "Pilih Paket",
        select_subscription: "Pilih Langganan",
        pick_your_plan: "Pilih Paket Panjenengan",
        see_options_right: "Tingali pilihan wonten sisih tengen",
        select_your_power: "Pilih Kekuatan Panjenengan",
        subscription_word: "Langganan.",
        all_set: "Sampun Siap!",
        ready_to: "Panjenengan sampun siap kangge",
        level_up: "Naik Level!",
        boost_msg: "Adhedhasar pilihan Panjenengan, kami yakin Smash saged ningkataken pendapatan dugi 40% wonten 3 wulan rumiyin.",
        next_step: "Langkah Selajengipun:",
        next_step_desc: "Lengkapi registrasi profil panggenan kangge akses dashboard Panjenengan.",
        back_btn: "Wangsul",
        skip_btn: "Lewati",
        continue_btn: "Lanjutaken",
        get_started: "Wiwit Sakniki",
        verified_partner: "Mitra Terverifikasi",
        ready_to_launch: "Siap Diluncuraken!",
        goal_bookings: "Tingkataken Booking",
        goal_management: "Manajemen Gampil",
        goal_payments: "Pembayaran Online",
        goal_members: "Sistem Member",
        goal_tournaments: "Turnamen",

        // Footer
        footer_tagline: "Badminton kangge generasi internet.",
        footer_tagline_line2: "Langkung gampil. Langkung semangat.",
        footer_platform: "Platform",
        footer_find_court: "Pados Lapangan",
        footer_tournaments: "Turnamen",
        footer_coaching: "Pelatihan",
        footer_pro_shop: "Toko Pro",
        footer_legal: "Legal",
        footer_privacy: "Privasi",
        footer_terms: "Ketentuan",
        footer_cookies: "Cookies",
        footer_copyright: "© 2024 Smash & Serve.",
        footer_designed_in: "Didesain wonten Metaverse",

        // Booking Section
        lock_it_in: "Pesthekake Slot",
        details_header: "Katerangan",
        back_to_halls: "Wangsul dateng Daftar",
        select_date: "Pilih Tanggal",
        available_slots: "Slot Kasedhiya",
        court_fee: "Biaya Sewa",
        service_fee: "Biaya Layanan",
        total: "GUNGGUNG",
        confirm_booking: "KONFIRMASI PESENAN",
        booked: "Dipesen",
        no_slots: "Mboten wonten slot",
        select_court_location: "Pilih Panggenan Lapangan",
        location_label: "Lokasi",
        facilities_label: "Fasilitas",
        courts: "Lapangan",
        floor: "Lantai",
        venue_label: "Panggenan",
        court_label: "Lapangan",
        address_label: "Alamat",
        court_type_standard: "Lapangan Standar",
        court_type_vinyl: "Lapangan Karpet",
        court_type_wood: "Lapangan Kajeng",
        court_type_cement: "Lapangan Semen"
    }
}

