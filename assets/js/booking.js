// Booking & Payment Management Module

(function() {
  'use strict';

  let currentBookingId = null;

  // DOM Elements
  const floatingBookBtn = document.getElementById('floatingBookBtn');
  const bookingModal = document.getElementById('bookingModal');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  const bookingForm = document.getElementById('bookingForm');
  const bookingFormStep = document.getElementById('bookingFormStep');
  const paymentStep = document.getElementById('paymentStep');
  const bookingError = document.getElementById('bookingError');
  const uploadError = document.getElementById('uploadError');
  const slotDateSelect = document.getElementById('bSlotDate');
  const slotTimeSelect = document.getElementById('bSlotTime');
  const bookingConfirmMsg = document.getElementById('bookingConfirmMsg');

  // Upload elements
  const pickFileBtn = document.getElementById('pickFileBtn');
  const screenshotInput = document.getElementById('screenshotInput');
  const selectedFileName = document.getElementById('selectedFileName');
  const uploadBtn = document.getElementById('uploadBtn');
  const upiRefInput = document.getElementById('upiRef');
  const paymentSuccessMsg = document.getElementById('paymentSuccessMsg');
  const uploadDropZone = document.getElementById('uploadDropZone');

  // Pre-fill fields from chat state if available
  function prefillFromChat() {
    if (window.CHAT_USER_DATA) {
      const u = window.CHAT_USER_DATA;
      if (u.name) document.getElementById('bName').value = u.name;
      if (u.dob) document.getElementById('bDob').value = u.dob;
      if (u.tob) document.getElementById('bTob').value = u.tob;
      if (u.pob) document.getElementById('bPob').value = u.pob;
    }
  }

  // Populate slot dates (next 7 days starting tomorrow)
  function initSlotDates() {
    if (!slotDateSelect) return;
    slotDateSelect.innerHTML = '<option value="">தேதியை தேர்வு செய்யவும்</option>';
    
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('ta-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const opt = document.createElement('option');
      opt.value = iso;
      opt.textContent = `${iso} (${display})`;
      slotDateSelect.appendChild(opt);
    }
  }

  // Filter already booked slots when date changes
  async function onDateChange() {
    const selectedDate = slotDateSelect.value;
    if (!selectedDate) return;

    try {
      const res = await fetch(`api/booking.php?date=${selectedDate}`);
      if (!res.ok) return;
      const data = await res.json();
      const booked = data.booked_slots || [];

      // Enable/disable time options
      Array.from(slotTimeSelect.options).forEach(opt => {
        if (!opt.value) return;
        const timeFull = opt.value.length === 5 ? opt.value + ':00' : opt.value;
        const isBooked = booked.some(b => b.startsWith(opt.value));
        if (isBooked) {
          opt.disabled = true;
          opt.textContent = opt.textContent.replace(' (Booked)', '') + ' (Booked)';
        } else {
          opt.disabled = false;
          opt.textContent = opt.textContent.replace(' (Booked)', '');
        }
      });
    } catch (e) {
      console.warn('Could not check slot availability:', e);
    }
  }

  function openModal() {
    prefillFromChat();
    initSlotDates();
    bookingFormStep.classList.remove('hidden');
    paymentStep.classList.add('hidden');
    bookingError.classList.add('hidden');
    bookingModal.classList.remove('hidden');
  }

  function closeModal() {
    bookingModal.classList.add('hidden');
  }

  // Handle Booking Form Submission
  async function handleBookingSubmit(e) {
    e.preventDefault();
    bookingError.classList.add('hidden');

    const name = document.getElementById('bName').value.trim();
    const phone = document.getElementById('bPhone').value.trim();
    const email = document.getElementById('bEmail').value.trim();
    const dob = document.getElementById('bDob').value.trim();
    const tob = document.getElementById('bTob').value.trim();
    const pob = document.getElementById('bPob').value.trim();
    const slotDate = slotDateSelect.value;
    const slotTime = slotTimeSelect.value;
    const question = document.getElementById('bQuestion').value.trim();

    if (!name || !phone || !slotDate || !slotTime) {
      showBookingError('தயவுசெய்து அனைத்து கட்டாய விவரங்களையும் பூர்த்தி செய்யவும்.');
      return;
    }

    const payload = {
      name, phone, email, dob, tob, pob,
      slot_date: slotDate,
      slot_time: slotTime,
      question,
      chart_json: window.CURRENT_CHART_DATA || null,
      lat: document.getElementById('chartLat')?.value || null,
      lon: document.getElementById('chartLon')?.value || null
    };

    const submitBtn = document.getElementById('bookSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'பதிவு செய்யப்படுகிறது...';

    try {
      const res = await fetch('api/booking.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error('சர்வரில் இருந்து சரியான தகவல் பெறப்படவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Slot பதிவு செய்வதில் பிழை ஏற்பட்டது.');
      }

      currentBookingId = data.booking_id;
      bookingConfirmMsg.innerHTML = `
        <strong>பதிவு எண் (Booking ID):</strong> #${data.booking_id}<br>
        <strong>தேதி:</strong> ${data.slot_date} | <strong>நேரம்:</strong> ${data.slot_time}<br>
        <strong>பெயர்:</strong> ${name} (${phone})
      `;

      // Transition to Step 2 (Payment)
      bookingFormStep.classList.add('hidden');
      paymentStep.classList.remove('hidden');

    } catch (err) {
      showBookingError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Slot பதிவு செய்யுங்கள் →';
    }
  }

  function showBookingError(msg) {
    bookingError.textContent = msg;
    bookingError.classList.remove('hidden');
  }

  function showUploadError(msg) {
    uploadError.textContent = msg;
    uploadError.classList.remove('hidden');
  }

  // File Upload Handlers
  function handleFileSelect(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showUploadError('JPG, PNG அல்லது WebP படங்கள் மட்டுமே அனுமதிக்கப்படும்.');
      screenshotInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showUploadError('படத்தின் அளவு 5MB-க்கு குறைவாக இருக்க வேண்டும்.');
      screenshotInput.value = '';
      return;
    }

    uploadError.classList.add('hidden');
    selectedFileName.textContent = `தேர்ந்தெடுக்கப்பட்டது: ${file.name} (${Math.round(file.size / 1024)} KB)`;
  }

  async function handleUploadSubmit() {
    if (!currentBookingId) {
      showUploadError('பதிவு எண் கிடைக்கவில்லை. தயவுசெய்து படிவத்தை மீண்டும் பூர்த்தி செய்யவும்.');
      return;
    }

    const formData = new FormData();
    formData.append('booking_id', currentBookingId);
    
    // Screenshot is completely optional
    if (screenshotInput.files && screenshotInput.files[0]) {
      formData.append('screenshot', screenshotInput.files[0]);
    }
    if (upiRefInput && upiRefInput.value) {
      formData.append('upi_ref', upiRefInput.value.trim());
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'உறுதிப்படுத்தப்படுகிறது...';

    try {
      const res = await fetch('api/upload.php', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'விவரங்களை உறுதிப்படுத்துவதில் தோல்வி.');
      }

      document.querySelector('.upload-section').classList.add('hidden');
      paymentSuccessMsg.classList.remove('hidden');

    } catch (err) {
      showUploadError(err.message);
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'உறுதிப்படுத்துக ✓ (Confirm Booking)';
    }
  }

  // Event Listeners
  document.addEventListener('DOMContentLoaded', () => {
    if (floatingBookBtn) floatingBookBtn.addEventListener('click', openModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);
    if (slotDateSelect) slotDateSelect.addEventListener('change', onDateChange);

    // Upload triggers
    if (pickFileBtn && screenshotInput) {
      pickFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        screenshotInput.click();
      });
      screenshotInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
      });
    }

    if (uploadDropZone) {
      uploadDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropZone.classList.add('drag-hover');
      });
      uploadDropZone.addEventListener('dragleave', () => {
        uploadDropZone.classList.remove('drag-hover');
      });
      uploadDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropZone.classList.remove('drag-hover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          screenshotInput.files = e.dataTransfer.files;
          handleFileSelect(e.dataTransfer.files[0]);
        }
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener('click', handleUploadSubmit);
    }
  });

  // Export helper to global for chat triggers
  window.openBookingModal = openModal;

})();

