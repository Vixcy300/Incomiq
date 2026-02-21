package com.incomiq.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import io.flutter.embedding.engine.FlutterEngineCache
import io.flutter.plugin.common.MethodChannel

class SmsReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL = "com.incomiq.app/sms"
        private val BANK_KEYWORDS = listOf(
            "SBI", "HDFC", "ICICI", "AXIS", "KOTAK", "PNB", "BOB",
            "PHONEPE", "PAYTM", "GPAY", "AMAZONPAY", "YESBANK",
            "INDUSIND", "FEDERAL", "HDFCBK", "SBIINB", "ICICIB",
            "TATAPAY", "BAJAJFIN", "CANARA", "UNION"
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        for (message in messages) {
            val sender = message.originatingAddress ?: continue
            if (!BANK_KEYWORDS.any { kw -> sender.uppercase().contains(kw) }) continue

            val smsData = mapOf(
                "sender" to sender,
                "body" to (message.messageBody ?: ""),
                "timestamp" to message.timestampMillis
            )

            val engine = FlutterEngineCache.getInstance().get("main_engine")
            engine?.let {
                MethodChannel(it.dartExecutor.binaryMessenger, CHANNEL)
                    .invokeMethod("onSmsReceived", smsData)
            }
        }
    }
}
