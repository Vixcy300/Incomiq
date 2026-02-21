package com.incomiq.app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.plugin.common.MethodChannel
import android.database.Cursor
import android.net.Uri

class MainActivity : FlutterActivity() {

    private val SMS_CHANNEL = "com.incomiq.app/sms"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Cache engine for SMS BroadcastReceiver
        FlutterEngineCache.getInstance().put("main_engine", flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "readAllSms" -> {
                        val smsList = readAllBankSms()
                        result.success(smsList)
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun readAllBankSms(): List<Map<String, Any>> {
        val smsList = mutableListOf<Map<String, Any>>()
        val bankKeywords = listOf(
            "SBI", "HDFC", "ICICI", "AXIS", "KOTAK", "PNB", "BOB",
            "PHONEPE", "PAYTM", "GPAY", "AMAZONPAY", "YESBANK",
            "INDUSIND", "FEDERAL", "HDFCBK", "SBIINB", "ICICIB",
            "TATAPAY", "BAJAJFIN", "CANARA", "UNION", "IOB"
        )

        try {
            val cursor: Cursor? = contentResolver.query(
                Uri.parse("content://sms/inbox"),
                arrayOf("_id", "address", "body", "date"),
                null,
                null,
                "date DESC LIMIT 500"
            )

            cursor?.use { c ->
                val idIdx = c.getColumnIndex("_id")
                val addrIdx = c.getColumnIndex("address")
                val bodyIdx = c.getColumnIndex("body")
                val dateIdx = c.getColumnIndex("date")

                while (c.moveToNext()) {
                    val sender = if (addrIdx >= 0) c.getString(addrIdx) ?: continue else continue
                    val body = if (bodyIdx >= 0) c.getString(bodyIdx) ?: continue else continue
                    val date = if (dateIdx >= 0) c.getLong(dateIdx) else 0L
                    val id = if (idIdx >= 0) c.getString(idIdx) ?: "" else ""

                    if (bankKeywords.any { kw -> sender.uppercase().contains(kw) }) {
                        smsList.add(
                            mapOf(
                                "id" to id,
                                "sender" to sender,
                                "body" to body,
                                "timestamp" to date
                            )
                        )
                    }
                }
            }
        } catch (_: Exception) { }

        return smsList
    }
}
