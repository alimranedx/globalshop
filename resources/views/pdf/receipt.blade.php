<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GlobalShop Order Receipt #{{ $sale->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            font-size: 13px;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
        }
        .header-table, .info-table, .items-table, .total-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
        }
        .brand {
            font-size: 24px;
            font-weight: 800;
            color: #6366f1;
            letter-spacing: -0.5px;
        }
        .subtitle {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .invoice-title {
            text-align: right;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
        }
        .invoice-details {
            text-align: right;
            font-size: 12px;
            color: #475569;
        }
        .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 20px 0;
        }
        .info-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 15px;
        }
        .info-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
        }
        .info-body {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
        }
        .items-table {
            margin-top: 15px;
        }
        .items-table th {
            background-color: #4f46e5;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 9px 12px;
            text-align: left;
        }
        .items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
        }
        .items-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: 700;
            border-radius: 12px;
            text-transform: uppercase;
        }
        .badge-completed {
            background-color: #dcfce7;
            color: #15803d;
        }
        .badge-pending {
            background-color: #fef3c7;
            color: #b45309;
        }
        .badge-cancelled {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        .total-section {
            width: 40%;
            margin-left: auto;
            margin-top: 20px;
        }
        .total-row td {
            padding: 4px 0;
            font-size: 12px;
        }
        .total-row.grand-total td {
            font-size: 15px;
            font-weight: 800;
            color: #4f46e5;
            border-top: 2px solid #e2e8f0;
            padding-top: 8px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <!-- Top Header -->
    <table class="header-table">
        <tr>
            <td>
                <div class="brand">GlobalShop</div>
                <div class="subtitle">Multi-Tenant E-Commerce Marketplace</div>
            </td>
            <td>
                <div class="invoice-title">OFFICIAL RECEIPT</div>
                <div class="invoice-details">
                    <strong>Invoice #:</strong> {{ $sale->invoice_number }}<br>
                    <strong>Date:</strong> {{ $sale->created_at ? $sale->created_at->format('M d, Y h:i A') : date('M d, Y') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- Customer & Seller Info -->
    <table class="header-table">
        <tr>
            <td style="width: 48%;">
                <div class="info-card">
                    <div class="info-title">Billed &amp; Shipped To:</div>
                    <div class="info-body">{{ $sale->customer_name ?? 'Valued Customer' }}</div>
                    <div style="color: #475569; font-size: 12px; margin-top: 2px;">
                        Phone: {{ $sale->customer_phone }}<br>
                        Address: {{ $sale->shipping_address ?? 'N/A' }}
                    </div>
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%;">
                <div class="info-card">
                    <div class="info-title">Seller Storefront:</div>
                    <div class="info-body">🏪 {{ $sale->shop->name ?? 'GlobalShop Merchant' }}</div>
                    <div style="color: #475569; font-size: 12px; margin-top: 2px;">
                        Payment Method: <span style="text-transform: capitalize;">{{ $sale->payment_method ?? 'Cash' }}</span><br>
                        Order Status: 
                        <span class="badge {{ $sale->status === 'completed' ? 'badge-completed' : ($sale->status === 'pending' ? 'badge-pending' : 'badge-cancelled') }}">
                            {{ strtoupper($sale->status ?? 'completed') }}
                        </span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 50%;">Product Name</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Unit Price</th>
                <th style="width: 15%; text-align: right;">Item Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sale->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->product_name }}</strong>
                    </td>
                    <td style="text-align: center;">{{ (float) $item->quantity }}</td>
                    <td style="text-align: right;">${{ number_format($item->price, 2) }}</td>
                    <td style="text-align: right;">${{ number_format($item->total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Totals Summary -->
    <div class="total-section">
        <table class="total-table">
            <tr class="total-row">
                <td style="color: #64748b;">Subtotal:</td>
                <td style="text-align: right; font-weight: 600;">${{ number_format($sale->subtotal, 2) }}</td>
            </tr>
            @if($sale->discount > 0)
                <tr class="total-row">
                    <td style="color: #64748b;">Discount:</td>
                    <td style="text-align: right; font-weight: 600; color: #16a34a;">-${{ number_format($sale->discount, 2) }}</td>
                </tr>
            @endif
            @if($sale->tax > 0)
                <tr class="total-row">
                    <td style="color: #64748b;">Tax / VAT:</td>
                    <td style="text-align: right; font-weight: 600;">${{ number_format($sale->tax, 2) }}</td>
                </tr>
            @endif
            <tr class="total-row grand-total">
                <td>Grand Total:</td>
                <td style="text-align: right;">${{ number_format($sale->total, 2) }}</td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        Thank you for your purchase on <strong>GlobalShop</strong> Marketplace!<br>
        If you have any questions regarding this invoice, please contact support or your merchant.
    </div>
</body>
</html>
