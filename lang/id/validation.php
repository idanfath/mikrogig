<?php

return [
  /*
   * |--------------------------------------------------------------------------
   * | Baris Bahasa untuk Validasi
   * |--------------------------------------------------------------------------
   * |
   * | Baris bahasa berikut berisi pesan kesalahan standar yang digunakan oleh
   * | kelas validator. Beberapa aturan memiliki beberapa versi seperti
   * | aturan ukuran. Jangan ragu untuk mengubah setiap pesan di sini.
   * |
   */
  'accepted' => ':attribute harus diterima.',
  'accepted_if' => ':attribute harus diterima ketika :other bernilai :value.',
  'active_url' => ':attribute bukan URL yang valid.',
  'after' => ':attribute harus berupa tanggal setelah :date.',
  'after_or_equal' => ':attribute harus berupa tanggal setelah atau sama dengan :date.',
  'alpha' => ':attribute hanya boleh berisi huruf.',
  'alpha_dash' => ':attribute hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
  'alpha_num' => ':attribute hanya boleh berisi huruf dan angka.',
  'any_of' => ':attribute yang dipilih tidak valid.',
  'array' => ':attribute harus berupa array.',
  'ascii' => ':attribute hanya boleh berisi karakter alfanumerik dan simbol single-byte.',
  'before' => ':attribute harus berupa tanggal sebelum :date.',
  'before_or_equal' => ':attribute harus berupa tanggal sebelum atau sama dengan :date.',
  'between' => [
    'array' => ':attribute harus berjumlah antara :min sampai :max item.',
    'file' => 'Ukuran :attribute harus antara :min sampai :max kilobita.',
    'numeric' => ':attribute harus bernilai antara :min sampai :max.',
    'string' => ':attribute harus berjumlah antara :min sampai :max karakter.',
  ],
  'boolean' => ':attribute harus bernilai true atau false.',
  'can' => ':attribute berisi nilai yang tidak diizinkan.',
  'confirmed' => 'Konfirmasi :attribute tidak cocok.',
  'contains' => ':attribute kekurangan nilai yang diwajibkan.',
  'current_password' => 'Password salah.',
  'date' => ':attribute bukan tanggal yang valid.',
  'date_equals' => ':attribute harus berupa tanggal yang sama dengan :date.',
  'date_format' => ':attribute tidak sesuai dengan format :format.',
  'decimal' => ':attribute harus memiliki :decimal tempat desimal.',
  'declined' => ':attribute harus ditolak.',
  'declined_if' => ':attribute harus ditolak ketika :other bernilai :value.',
  'different' => ':attribute dan :other harus berbeda.',
  'digits' => ':attribute harus berjumlah :digits digit.',
  'digits_between' => ':attribute harus berjumlah antara :min sampai :max digit.',
  'dimensions' => ':attribute memiliki dimensi gambar yang tidak valid.',
  'distinct' => ':attribute memiliki nilai duplikat.',
  'doesnt_contain' => ':attribute tidak boleh berisi salah satu dari: :values.',
  'doesnt_end_with' => ':attribute tidak boleh diakhiri dengan: :values.',
  'doesnt_start_with' => ':attribute tidak boleh diawali dengan: :values.',
  'email' => ':attribute harus berupa alamat email yang valid.',
  'encoding' => ':attribute harus dikodekan dalam format :encoding.',
  'ends_with' => ':attribute harus diakhiri dengan salah satu dari: :values.',
  'enum' => ':attribute yang dipilih tidak valid.',
  'exists' => ':attribute yang dipilih tidak valid.',
  'extensions' => ':attribute harus memiliki salah satu ekstensi berikut: :values.',
  'file' => ':attribute harus berupa file.',
  'filled' => ':attribute harus diisi.',
  'gt' => [
    'array' => ':attribute harus memiliki lebih dari :value item.',
    'file' => 'Ukuran :attribute harus lebih besar dari :value kilobita.',
    'numeric' => ':attribute harus lebih besar dari :value.',
    'string' => ':attribute harus lebih panjang dari :value karakter.',
  ],
  'gte' => [
    'array' => ':attribute harus memiliki :value item atau lebih.',
    'file' => 'Ukuran :attribute harus lebih besar dari atau sama dengan :value kilobita.',
    'numeric' => ':attribute harus lebih besar dari atau sama dengan :value.',
    'string' => ':attribute harus berjumlah minimal :value karakter.',
  ],
  'hex_color' => ':attribute harus berupa warna heksadesimal yang valid.',
  'image' => ':attribute harus berupa gambar.',
  'in' => ':attribute yang dipilih tidak valid.',
  'in_array' => ':attribute harus ada di :other.',
  'in_array_keys' => ':attribute harus berisi salah satu kunci berikut: :values.',
  'integer' => ':attribute harus berupa bilangan bulat.',
  'ip' => ':attribute harus berupa alamat IP yang valid.',
  'ipv4' => ':attribute harus berupa alamat IPv4 yang valid.',
  'ipv6' => ':attribute harus berupa alamat IPv6 yang valid.',
  'json' => ':attribute harus berupa string JSON yang valid.',
  'list' => ':attribute harus berupa list.',
  'lowercase' => ':attribute harus berupa huruf kecil.',
  'lt' => [
    'array' => ':attribute harus memiliki kurang dari :value item.',
    'file' => 'Ukuran :attribute harus lebih kecil dari :value kilobita.',
    'numeric' => ':attribute harus lebih kecil dari :value.',
    'string' => ':attribute harus lebih pendek dari :value karakter.',
  ],
  'lte' => [
    'array' => ':attribute tidak boleh memiliki lebih dari :value item.',
    'file' => 'Ukuran :attribute harus lebih kecil dari atau sama dengan :value kilobita.',
    'numeric' => ':attribute harus lebih kecil dari atau sama dengan :value.',
    'string' => ':attribute harus berjumlah maksimal :value karakter.',
  ],
  'mac_address' => ':attribute harus berupa alamat MAC yang valid.',
  'max' => [
    'array' => ':attribute tidak boleh memiliki lebih dari :max item.',
    'file' => 'Ukuran :attribute tidak boleh lebih dari :max kilobita.',
    'numeric' => ':attribute tidak boleh lebih besar dari :max.',
    'string' => ':attribute tidak boleh lebih panjang dari :max karakter.',
  ],
  'max_digits' => ':attribute tidak boleh lebih dari :max digit.',
  'mimes' => ':attribute harus berupa file bertipe: :values.',
  'mimetypes' => ':attribute harus berupa file bertipe: :values.',
  'min' => [
    'array' => ':attribute harus memiliki minimal :min item.',
    'file' => 'Ukuran :attribute minimal harus :min kilobita.',
    'numeric' => ':attribute minimal harus bernilai :min.',
    'string' => ':attribute minimal harus berjumlah :min karakter.',
  ],
  'min_digits' => ':attribute harus memiliki minimal :min digit.',
  'missing' => ':attribute tidak boleh ada.',
  'missing_if' => ':attribute tidak boleh ada ketika :other bernilai :value.',
  'missing_unless' => ':attribute tidak boleh ada kecuali :other bernilai :value.',
  'missing_with' => ':attribute tidak boleh ada ketika :values tersedia.',
  'missing_with_all' => ':attribute tidak boleh ada ketika :values tersedia.',
  'multiple_of' => ':attribute harus merupakan kelipatan dari :value.',
  'not_in' => ':attribute yang dipilih tidak valid.',
  'not_regex' => 'Format :attribute tidak valid.',
  'numeric' => ':attribute harus berupa angka.',
  'password' => [
    'letters' => ':attribute harus mengandung minimal satu huruf.',
    'mixed' => ':attribute harus mengandung minimal satu huruf besar dan satu huruf kecil.',
    'numbers' => ':attribute harus mengandung minimal satu angka.',
    'symbols' => ':attribute harus mengandung minimal satu simbol.',
    'uncompromised' => ':attribute yang dimasukkan telah muncul dalam kebocoran data. Silakan pilih :attribute yang lain.',
  ],
  'present' => ':attribute wajib ada.',
  'present_if' => ':attribute wajib ada ketika :other bernilai :value.',
  'present_unless' => ':attribute wajib ada kecuali :other bernilai :value.',
  'present_with' => ':attribute wajib ada ketika :values tersedia.',
  'present_with_all' => ':attribute wajib ada ketika :values tersedia.',
  'prohibited' => ':attribute tidak diizinkan.',
  'prohibited_if' => ':attribute tidak diizinkan ketika :other bernilai :value.',
  'prohibited_if_accepted' => ':attribute tidak diizinkan ketika :other diterima.',
  'prohibited_if_declined' => ':attribute tidak diizinkan ketika :other ditolak.',
  'prohibited_unless' => ':attribute tidak diizinkan kecuali :other ada dalam :values.',
  'prohibits' => ':attribute melarang :other untuk ada.',
  'regex' => 'Format :attribute tidak valid.',
  'required' => ':attribute wajib diisi.',
  'required_array_keys' => ':attribute harus berisi entri untuk: :values.',
  'required_if' => ':attribute wajib diisi ketika :other bernilai :value.',
  'required_if_accepted' => ':attribute wajib diisi ketika :other diterima.',
  'required_if_declined' => ':attribute wajib diisi ketika :other ditolak.',
  'required_unless' => ':attribute wajib diisi kecuali :other ada dalam :values.',
  'required_with' => ':attribute wajib diisi ketika :values tersedia.',
  'required_with_all' => ':attribute wajib diisi ketika :values tersedia.',
  'required_without' => ':attribute wajib diisi ketika :values tidak tersedia.',
  'required_without_all' => ':attribute wajib diisi ketika :values tidak tersedia sama sekali.',
  'same' => ':attribute dan :other harus sama.',
  'size' => [
    'array' => ':attribute harus berisi :size item.',
    'file' => 'Ukuran :attribute harus :size kilobita.',
    'numeric' => ':attribute harus bernilai :size.',
    'string' => ':attribute harus berjumlah :size karakter.',
  ],
  'starts_with' => ':attribute harus diawali dengan salah satu dari: :values.',
  'string' => ':attribute harus berupa string.',
  'timezone' => ':attribute harus berupa zona waktu yang valid.',
  'unique' => ':attribute sudah terdaftar.',
  'uploaded' => ':attribute gagal diunggah.',
  'uppercase' => ':attribute harus berupa huruf besar.',
  'url' => ':attribute harus berupa URL yang valid.',
  'ulid' => ':attribute harus berupa ULID yang valid.',
  'uuid' => ':attribute harus berupa UUID yang valid.',

  /*
   * |--------------------------------------------------------------------------
   * | Custom Validation Language Lines
   * |--------------------------------------------------------------------------
   * |
   * | Here you may specify custom validation messages for attributes using the
   * | convention "attribute.rule" to name the lines. This makes it quick to
   * | specify a specific custom language line for a given attribute rule.
   * |
   */
  'custom' => [
    'attribute-name' => [
      'rule-name' => 'custom-message',
    ],
  ],

  /*
   * |--------------------------------------------------------------------------
   * | Custom Validation Attributes
   * |--------------------------------------------------------------------------
   * |
   * | The following language lines are used to swap our attribute placeholder
   * | with something more reader friendly such as "E-Mail Address" instead
   * | of "email". This simply helps us make our message more expressive.
   * |
   */
  'attributes' => [],
];
