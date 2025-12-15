# 🔧 WATI Debug Steps

## Current Issue
WhatsApp OTP is failing with: "Failed to send WhatsApp text OTP"

## Quick Debug Steps

### 1. **Check Console Logs**
When you try to send OTP, look for these detailed logs:
```
📊 Response Status: [number]
📊 Response OK: [true/false]
📊 Result Object: [JSON object]
📊 Result.result: [value]
📊 Result.success: [value]
📊 Result.info: [error message]
```

### 2. **Run Diagnostics**
Add this to any component and run it:

```javascript
import { runDiagnostics } from '../utils/watiDiagnostics';

// Run in component or console
runDiagnostics('+917744847294');
```

### 3. **Check WATI Dashboard**
1. Login to your WATI dashboard
2. Go to **Messages** or **Logs**
3. Check if API calls are being received
4. Look for error messages or failed deliveries

### 4. **Verify Phone Number Format**
The API expects phone numbers in format: `917744847294` (no + sign)

Current formats being tried:
- `+917744847294` → `917744847294` ✅
- Indian numbers: `91XXXXXXXXXX`
- US numbers: `1XXXXXXXXXX`

### 5. **Test with Simple Message**
Try sending a simple message first:

```javascript
// Test basic connectivity
fetch('https://app-server.wati.io/api/v1/sendSessionMessage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    whatsappNumber: '14798024855', // Your number
    messageText: 'Test message'
  }),
});
```

## Common WATI Issues & Solutions

### ❌ **Authentication Failed (401)**
- **Cause**: Expired or invalid access token
- **Solution**: Generate new token in WATI dashboard

### ❌ **Forbidden (403)** 
- **Cause**: Account suspended or rate limited
- **Solution**: Check WATI account status and billing

### ❌ **Invalid Phone Number (400)**
- **Cause**: Wrong phone number format
- **Solution**: Use format without + (e.g., `917744847294`)

### ❌ **Empty Response/JSON Parse Error**
- **Cause**: WATI API returning empty response
- **Solution**: Enable debug logs and check raw response

### ❌ **Template Not Found**
- **Cause**: Template not approved or wrong name
- **Solution**: Use text messages instead of templates

## Expected Debug Output

### ✅ **Success Case:**
```
📊 Response Status: 200
📊 Response OK: true
📊 Result Object: {"result": true, "id": "message123"}
✅ WATI: WhatsApp text OTP sent successfully
```

### ❌ **Failure Case:**
```
📊 Response Status: 400
📊 Response OK: false
📊 Result Object: {"result": false, "info": "Invalid phone number"}
❌ WATI: Failed to send WhatsApp text OTP
```

## Next Steps Based on Debug Results

1. **If authentication fails (401)**: Update your WATI access token
2. **If phone format fails (400)**: Check phone number format
3. **If service unavailable (403/500)**: Try SMS fallback
4. **If all fails**: Use development SMS simulation

## SMS Fallback Status
✅ **Implemented**: Firebase Auth SMS + Development simulation
✅ **Working**: Console logging for development
✅ **Production Ready**: Firebase SMS integration available

---

**Run the diagnostics first to see the exact error, then we can fix the specific issue!**