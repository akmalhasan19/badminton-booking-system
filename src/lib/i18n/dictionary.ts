export type Language = 'en' | 'id' | 'jv';

export type Dictionary = {
    // Navbar
    home: string;
    book: string;
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
}

export const dictionaries: Record<Language, Dictionary> = {
    en: {
        home: "HOME",
        book: "BOOK",
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
        back_to_home: "Back to Home"
    },
    id: {
        home: "BERANDA",
        book: "PESAN",
        shop: "BELANJA",
        join_us: "Gabung Mitra",
        login: "Masuk",
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
        back_to_home: "Kembali ke Beranda"
    },
    jv: {
        home: "GRIYA",
        book: "PESEN",
        shop: "WANDÉ",
        join_us: "Ndherek Gabung",
        login: "Mlebet",
        logout: "Medal",
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
        back_to_home: "Wangsul dateng Griya"
    }
}
