<?php
namespace App;
use PDO;
use Exception;
class MysqlClient {
    private $conn;
    private $useMysqli = false;
    public function __construct($host, $port, $user, $password, $dbName = '') {
        if (!extension_loaded('pdo_mysql') && extension_loaded('mysqli')) {
            $this->useMysqli = true;
            mysqli_report(MYSQLI_REPORT_OFF);
            $this->conn = new \mysqli($host, $user, $password, $dbName, $port);
            if ($this->conn->connect_error) {
                throw new Exception("Connection failed: " . $this->conn->connect_error);
            }
            $this->conn->set_charset("utf8mb4");
        } else {
            $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
            if ($dbName !== '') {
                $dsn .= ";dbname=$dbName";
            }
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 5
            ];
            $this->conn = new PDO($dsn, $user, $password, $options);
        }
    }
    public function getPdo() {
        if ($this->useMysqli) {
            throw new Exception("PDO not available; pdo_mysql extension is not loaded");
        }
        return $this->conn;
    }
    public function listDatabases() {
        if ($this->useMysqli) {
            $res = $this->conn->query("SHOW DATABASES");
            if (!$res) {
                throw new Exception($this->conn->error);
            }
            $databases = [];
            while ($row = $res->fetch_row()) {
                $databases[] = $row[0];
            }
            return $databases;
        } else {
            $stmt = $this->conn->query("SHOW DATABASES");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
    }
    public function listTables() {
        if ($this->useMysqli) {
            $res = $this->conn->query("SHOW TABLES");
            if (!$res) {
                throw new Exception($this->conn->error);
            }
            $tables = [];
            while ($row = $res->fetch_row()) {
                $tables[] = $row[0];
            }
            return $tables;
        } else {
            $stmt = $this->conn->query("SHOW TABLES");
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
    }
    public function getTableData($table, $page = 1, $limit = 50) {
        $offset = ($page - 1) * $limit;
        if ($this->useMysqli) {
            $countRes = $this->conn->query("SELECT COUNT(*) FROM `$table`");
            if (!$countRes) {
                throw new Exception($this->conn->error);
            }
            $total = (int)$countRes->fetch_row()[0];
            $dataRes = $this->conn->query("SELECT * FROM `$table` LIMIT $limit OFFSET $offset");
            if (!$dataRes) {
                throw new Exception($this->conn->error);
            }
            $rows = [];
            while ($row = $dataRes->fetch_assoc()) {
                $rows[] = $row;
            }
            $columns = [];
            if (!empty($rows)) {
                $columns = array_keys($rows[0]);
            } else {
                $descRes = $this->conn->query("DESCRIBE `$table`");
                if ($descRes) {
                    while ($row = $descRes->fetch_assoc()) {
                        $columns[] = $row['Field'];
                    }
                }
            }
            return [
                'columns' => $columns,
                'rows' => $rows,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ];
        } else {
            $countStmt = $this->conn->query("SELECT COUNT(*) FROM `$table`");
            $total = (int)$countStmt->fetchColumn();
            $dataStmt = $this->conn->query("SELECT * FROM `$table` LIMIT $limit OFFSET $offset");
            $rows = $dataStmt->fetchAll();
            $columns = [];
            if (!empty($rows)) {
                $columns = array_keys($rows[0]);
            } else {
                $descStmt = $this->conn->query("DESCRIBE `$table`");
                while ($row = $descStmt->fetch()) {
                    $columns[] = $row['Field'];
                }
            }
            return [
                'columns' => $columns,
                'rows' => $rows,
                'total' => $total,
                'page' => $page,
                'limit' => $limit
            ];
        }
    }
    public function executeQuery($sql) {
        $sqlTrim = trim($sql);
        $upperSql = strtoupper($sqlTrim);
        $isSelect = (stripos($upperSql, 'SELECT') === 0 || stripos($upperSql, 'SHOW') === 0 || stripos($upperSql, 'DESCRIBE') === 0 || stripos($upperSql, 'EXPLAIN') === 0);
        if ($this->useMysqli) {
            if ($isSelect) {
                $res = $this->conn->query($sql);
                if (!$res) {
                    throw new Exception($this->conn->error);
                }
                $rows = [];
                while ($row = $res->fetch_assoc()) {
                    $rows[] = $row;
                }
                $columns = !empty($rows) ? array_keys($rows[0]) : [];
                return [
                    'type' => 'select',
                    'columns' => $columns,
                    'rows' => $rows,
                    'affected_rows' => count($rows)
                ];
            } else {
                $res = $this->conn->query($sql);
                if (!$res) {
                    throw new Exception($this->conn->error);
                }
                return [
                    'type' => 'execute',
                    'affected_rows' => $this->conn->affected_rows
                ];
            }
        } else {
            if ($isSelect) {
                $stmt = $this->conn->query($sql);
                $rows = $stmt->fetchAll();
                $columns = !empty($rows) ? array_keys($rows[0]) : [];
                return [
                    'type' => 'select',
                    'columns' => $columns,
                    'rows' => $rows,
                    'affected_rows' => count($rows)
                ];
            } else {
                $affected = $this->conn->exec($sql);
                return [
                    'type' => 'execute',
                    'affected_rows' => $affected
                ];
            }
        }
    }
    public function executePrepare($sql, $params = []) {
        if ($this->useMysqli) {
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                throw new Exception($this->conn->error);
            }
            if (!empty($params)) {
                $types = '';
                $bindParams = [];
                foreach ($params as $param) {
                    if (is_int($param)) {
                        $types .= 'i';
                    } elseif (is_float($param)) {
                        $types .= 'd';
                    } else {
                        $types .= 's';
                    }
                    $bindParams[] = $param;
                }
                $stmt->bind_param($types, ...$bindParams);
            }
            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
            $affected = $stmt->affected_rows;
            $stmt->close();
            return $affected;
        } else {
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        }
    }
    public function getDatabaseStructure() {
        if ($this->useMysqli) {
            $res = $this->conn->query("SHOW TABLE STATUS");
            if (!$res) {
                throw new Exception($this->conn->error);
            }
            $tables = [];
            while ($row = $res->fetch_assoc()) {
                $tables[] = $row;
            }
            return $tables;
        } else {
            $stmt = $this->conn->query("SHOW TABLE STATUS");
            return $stmt->fetchAll();
        }
    }
    public function getTableColumns($table) {
        if ($this->useMysqli) {
            $res = $this->conn->query("DESCRIBE `$table`");
            if (!$res) {
                throw new Exception($this->conn->error);
            }
            $columns = [];
            while ($row = $res->fetch_assoc()) {
                $columns[] = $row;
            }
            return $columns;
        } else {
            $stmt = $this->conn->query("DESCRIBE `$table`");
            return $stmt->fetchAll();
        }
    }
}