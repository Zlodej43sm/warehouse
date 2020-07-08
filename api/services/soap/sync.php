<?php

$wsdl        = 'https://proschet.com.ua/proschet/ws/priceservice.1cws?wsdl';
$certificate = dirname(__FILE__) . '/cert/client02-proschet.pem';
$types       = array('getpricelist', 'getratelist');
$response    = array();

$options = array(
  'login'      => 'admin',
  'password'   => 'zsedcft',
  'local_cert' => $certificate
);

$type = in_array($argv[1], $types) ? $argv[1] : $types[0];

try {
  $client = new SoapClient($wsdl, $options);

//  if ($type == 'getpricelist') {
    $pricelist = $client->getpricelist();
    foreach ($pricelist->{'return'}->{'item'} as $product) {
      if (!isset($response['count'])) $response['count'] = 0;
      $response['products'][] = array(
        'name'  => $product->name,
        'price' => $product->price,
        'image' => $product->linkpic == '#' ? null : $product->linkpic,
      );
      $response['count']++;
    }
//  }

//  if ($type == 'getratelist') {
//    $ratelist = $client->getratelist();
//    foreach ($ratelist->{'return'}->{'item'} as $item) {
//      switch ($item->type) {
//        case 'Состояние':
//          $response['appearance'][] = array(
//            'rating' => $item->grade,
//            'rate'   => $item->rate,
//          );
//          break;
//        case 'Комплект':
//          $response['equipment'][] = array(
//            'rating' => $item->grade,
//            'rate'   => $item->rate,
//          );
//          break;
//        case 'Корректировка':
//          $response['correction'][] = array(
//            'rating' => $item->grade,
//            'rate'   => $item->rate,
//          );
//          break;
//      }
//    }
//  }
} catch (Exception $e) {
  $response['error'] = $e->getMessage();
}

// var_dump($response);
echo json_encode($response);
